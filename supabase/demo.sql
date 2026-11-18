-- ONEATTEND PRESENTATION DEMO ONLY.
-- Run in a NEW Supabase project's SQL editor. Contains fictitious data only.
-- No real users / auth / tenant authorization. Anonymous demo RPCs are intentional.
-- Never use this policy model with real student records or a production institute.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists oneattend_private;
revoke all on schema oneattend_private from public, anon, authenticated;

create table if not exists oneattend_private.secrets (
  id integer primary key check (id = 1),
  qr_secret text not null
);
insert into oneattend_private.secrets values (1, encode(extensions.gen_random_bytes(32),'hex')) on conflict do nothing;

create table if not exists public.demo_sessions (
  id text primary key default gen_random_uuid()::text,
  course_id text not null check (course_id in ('CS3101','CS3102','CS3103','CS3104','CS3105','CS3106')),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  radius integer not null default 50 check (radius = 50)
);
create unique index if not exists one_open_session_per_course on public.demo_sessions(course_id) where status='open';
create table if not exists public.demo_check_ins (
  session_id text references public.demo_sessions(id) on delete cascade,
  student_id text not null,
  created_at timestamptz not null default now(),
  distance double precision,
  primary key(session_id,student_id)
);
create table if not exists public.demo_corrections (
  id bigint generated always as identity primary key,
  session_id text not null references public.demo_sessions(id),
  student_id text not null,
  present boolean not null,
  reason text not null,
  created_at timestamptz not null default now()
);
-- Tables are not directly accessible. Only explicit demo RPCs can read/write.
alter table public.demo_sessions enable row level security;
alter table public.demo_check_ins enable row level security;
alter table public.demo_corrections enable row level security;
revoke all on public.demo_sessions,public.demo_check_ins,public.demo_corrections from anon,authenticated;

-- Deterministic 12-week historical seed: same formula as packages/core/src/data.ts.
insert into public.demo_sessions(id,course_id,created_at,status,lat,lon)
select 'history-CS31'||lpad((c+1)::text,2,'0')||'-'||w||'-'||d,
       'CS31'||lpad((c+1)::text,2,'0'),
       timestamptz '2026-08-03 03:30:00+00' + make_interval(days=>w*7+(c%3)+d*2,hours=>c%3),
       'closed',25.535,84.851
from generate_series(0,5) c cross join generate_series(0,11) w cross join generate_series(0,1) d
on conflict do nothing;
insert into public.demo_check_ins(session_id,student_id,created_at)
select 'history-CS31'||lpad((c+1)::text,2,'0')||'-'||w||'-'||d,
       case when s<56 then '2401AI'||lpad((s+1)::text,2,'0') else '2401CS'||lpad((s-55)::text,2,'0') end,
       timestamptz '2026-08-03 03:30:00+00' + make_interval(days=>w*7+(c%3)+d*2,hours=>c%3) + interval '1 minute' + s*interval '0.9 seconds'
from generate_series(0,5) c cross join generate_series(0,11) w cross join generate_series(0,1) d cross join generate_series(0,151) s
where (((w*2+d)*7+s+c)%24) < 14+((s*7+c*3)%11)
on conflict do nothing;

create or replace function oneattend_private.valid_student(p_student text)
returns boolean language sql immutable set search_path='' as $$
  select p_student ~ '^2401AI(0[1-9]|[1-4][0-9]|5[0-6])$' or p_student ~ '^2401CS(0[1-9]|[1-8][0-9]|9[0-6])$';
$$;

create or replace function public.demo_snapshot(p_student text default null, p_course text default null)
returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'sessions',coalesce((select jsonb_agg(to_jsonb(s) order by s.created_at) from public.demo_sessions s where p_course is null or s.course_id=p_course),'[]'::jsonb),
 'check_ins',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at) from public.demo_check_ins c join public.demo_sessions s on s.id=c.session_id where (p_student is null or c.student_id=p_student) and (p_course is null or s.course_id=p_course)),'[]'::jsonb),
 'corrections',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select a.* from public.demo_corrections a join public.demo_sessions s on s.id=a.session_id where (p_student is null or a.student_id=p_student) and (p_course is null or s.course_id=p_course) order by a.created_at desc limit 50) a),'[]'::jsonb)
 );
$$;

create or replace function public.demo_open_session(p_course text,p_lat double precision,p_lon double precision)
returns text language plpgsql security definer set search_path='' as $$
declare sid text;
begin
 if p_lat is null or p_lon is null or not(p_lat between -90 and 90) or not(p_lon between -180 and 180) then raise exception 'Select a valid classroom point on the map.'; end if;
 insert into public.demo_sessions(course_id,lat,lon) values(p_course,p_lat,p_lon) returning id into sid;
 return sid;
exception when unique_violation then raise exception 'This course already has an open session. Close it first.';
end;
$$;

create or replace function public.demo_qr(p_session text)
returns text language plpgsql security definer set search_path='' as $$
declare slot bigint; secret text; token text;
begin
 if not exists(select 1 from public.demo_sessions where id=p_session and status='open') then raise exception 'This session is not open.'; end if;
 slot:=floor(extract(epoch from clock_timestamp())/3)::bigint;
 select qr_secret into secret from oneattend_private.secrets where id=1;
 token:=encode(extensions.hmac(p_session||':'||slot,secret,'sha256'),'hex');
 return jsonb_build_object('v',1,'session',p_session,'slot',slot,'token',token)::text;
end;
$$;

create or replace function public.demo_mark(p_payload jsonb,p_student text,p_lat double precision,p_lon double precision,p_accuracy double precision)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.demo_sessions; current_slot bigint; qr_slot bigint; secret text; expected text; a double precision; distance_m double precision; inserted integer;
begin
 if not coalesce(oneattend_private.valid_student(p_student),false) then raise exception 'Choose a valid demo student.'; end if;
 if p_payload->>'v' is distinct from '1' or coalesce(p_payload->>'slot','') !~ '^\d{1,15}$' then raise exception 'Invalid OneAttend QR.'; end if;
 -- Lock the session: a close cannot race and mark unchecked students absent mid-check-in.
 select * into s from public.demo_sessions where id=p_payload->>'session' for update;
 if not found or s.status<>'open' then raise exception 'This attendance session is closed.'; end if;
 qr_slot:=(p_payload->>'slot')::bigint;
 current_slot:=floor(extract(epoch from clock_timestamp())/3)::bigint;
 if qr_slot not in (current_slot,current_slot-1) then raise exception 'QR expired. Scan the current code.'; end if;
 select qr_secret into secret from oneattend_private.secrets where id=1;
 expected:=encode(extensions.hmac(s.id||':'||qr_slot,secret,'sha256'),'hex');
 if p_payload->>'token' is distinct from expected then raise exception 'QR signature is invalid.'; end if;
 if p_lat is null or p_lon is null or not(p_lat between -90 and 90) or not(p_lon between -180 and 180) then raise exception 'A valid GPS position is required.'; end if;
 if p_accuracy is null or not(p_accuracy between 0 and 100) then raise exception 'GPS accuracy is too low. Move near a window or outside and retry.'; end if;
 a:=sin(radians(p_lat-s.lat)/2)^2 + cos(radians(s.lat))*cos(radians(p_lat))*sin(radians(p_lon-s.lon)/2)^2;
 distance_m:=6371000*2*atan2(sqrt(greatest(0,least(1,a))),sqrt(greatest(0,1-a)));
 if distance_m>s.radius then raise exception 'You are %m away. Move within 50m of the selected classroom.',round(distance_m::numeric); end if;
 insert into public.demo_check_ins(session_id,student_id,distance) values(s.id,p_student,distance_m) on conflict do nothing;
 get diagnostics inserted=row_count;
 return jsonb_build_object('already',inserted=0,'distance',round(distance_m::numeric,1));
end;
$$;

create or replace function public.demo_close_session(p_session text,p_cancel boolean default false)
returns void language plpgsql security definer set search_path='' as $$
begin
 update public.demo_sessions set status=case when p_cancel then 'cancelled' else 'closed' end where id=p_session and status='open';
 if not found then raise exception 'This session has already been closed.'; end if;
 -- Absence is inferred from the full 152-person roster minus unique check-ins.
end;
$$;

create or replace function public.demo_correct(p_session text,p_student text,p_present boolean,p_reason text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not coalesce(oneattend_private.valid_student(p_student),false) then raise exception 'Invalid demo student.'; end if;
 if p_reason is null or length(trim(p_reason))<5 or length(p_reason)>1000 then raise exception 'Provide a reason between 5 and 1000 characters.'; end if;
 perform 1 from public.demo_sessions where id=p_session and status='closed' for update;
 if not found then raise exception 'Only finalised sessions can be corrected.'; end if;
 if p_present then insert into public.demo_check_ins(session_id,student_id) values(p_session,p_student) on conflict do nothing;
 else delete from public.demo_check_ins where session_id=p_session and student_id=p_student; end if;
 insert into public.demo_corrections(session_id,student_id,present,reason) values(p_session,p_student,p_present,p_reason);
end;
$$;

-- Revoke default public execution, then explicitly expose only the demo APIs.
revoke execute on function public.demo_snapshot(text,text),public.demo_open_session(text,double precision,double precision),public.demo_qr(text),public.demo_mark(jsonb,text,double precision,double precision,double precision),public.demo_close_session(text,boolean),public.demo_correct(text,text,boolean,text) from public;
grant execute on function public.demo_snapshot(text,text),public.demo_open_session(text,double precision,double precision),public.demo_qr(text),public.demo_mark(jsonb,text,double precision,double precision,double precision),public.demo_close_session(text,boolean),public.demo_correct(text,text,boolean,text) to anon,authenticated;
commit;
