import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { history, type Snapshot, type Session, type CheckIn } from './data';
import { haversine } from './analytics';
export type Point = { lat: number; lon: number };
export type Position = Point & { accuracy: number; timestamp: number };
export function createGateway(url?: string, key?: string) {
  const client: SupabaseClient | null = url && key ? createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}) : null;
  let local: Snapshot = { sessions:[...history.sessions],checkIns:[...history.checkIns] };
  async function rpc(name:string,args:Record<string,unknown> = {}) {
    const {data,error} = await client!.rpc(name,args);
    if (error) throw new Error(error.message);
    return data;
  }
  return {
    live: !!client,
    async snapshot():Promise<Snapshot> {
      if (!client) return {sessions:[...local.sessions],checkIns:[...local.checkIns]};
      const data = await rpc('demo_snapshot');
      const sessions:Session[] = data.sessions.map((s:any) => ({id:s.id,courseId:s.course_id,date:s.created_at,status:s.status,lat:s.lat,lon:s.lon,radius:s.radius}));
      const checkIns:CheckIn[] = data.check_ins.map((c:any) => ({sessionId:c.session_id,studentId:c.student_id,time:c.created_at,distance:c.distance}));
      return {sessions:[...history.sessions,...sessions],checkIns:[...history.checkIns,...checkIns]};
    },
    async open(courseId:string,point:Point):Promise<string> {
      if (client) return rpc('demo_open_session',{p_course:courseId,p_lat:point.lat,p_lon:point.lon});
      if (local.sessions.some(s => s.courseId===courseId && s.status==='open')) throw new Error('Close the existing session first.');
      const id = `demo-${Date.now()}`;
      local.sessions.push({id,courseId,date:new Date().toISOString(),status:'open',...point,radius:50});
      return id;
    },
    async qr(sessionId:string):Promise<string> {
      if (client) return rpc('demo_qr',{p_session:sessionId});
      return JSON.stringify({v:1,session:sessionId,slot:Math.floor(Date.now()/3000),token:'local-preview-only'});
    },
    async close(sessionId:string,cancel=false) {
      if (client) await rpc('demo_close_session',{p_session:sessionId,p_cancel:cancel});
      else local.sessions = local.sessions.map(s => s.id===sessionId ? {...s,status:cancel?'cancelled':'closed'}:s);
    },
    async correct(sessionId:string,studentId:string,present:boolean,reason:string) {
      if (reason.trim().length<5) throw new Error('Add a reason of at least five characters.');
      if (client) await rpc('demo_correct',{p_session:sessionId,p_student:studentId,p_present:present,p_reason:reason});
      else { local.checkIns = local.checkIns.filter(c => !(c.sessionId===sessionId && c.studentId===studentId)); if(present) local.checkIns.push({sessionId,studentId,time:new Date().toISOString()}); }
    },
    async mark(payload:string,studentId:string,position:Position):Promise<{already:boolean;distance:number}> {
      let qr: {v:number;session:string;slot:number;token:string};
      try {qr=JSON.parse(payload);} catch {throw new Error('This is not a OneAttend attendance QR.');}
      if (qr.v!==1 || typeof qr.session!=='string' || !Number.isInteger(qr.slot) || typeof qr.token!=='string') throw new Error('Invalid attendance QR.');
      if(!Number.isFinite(position.lat)||!Number.isFinite(position.lon)||Math.abs(position.lat)>90||Math.abs(position.lon)>180||!Number.isFinite(position.accuracy)||position.accuracy<0) throw new Error('Invalid GPS position.');
      if (Date.now()-position.timestamp>20000 || position.timestamp>Date.now()+5000) throw new Error('Location is stale. Scan again for a fresh GPS reading.');
      if(position.accuracy>100) throw new Error('GPS accuracy is too low. Move near a window or outdoors and retry.');
      if (client) return rpc('demo_mark',{p_payload:qr,p_student:studentId,p_lat:position.lat,p_lon:position.lon,p_accuracy:position.accuracy});
      const session=local.sessions.find(s=>s.id===qr.session && s.status==='open');
      if(!session) throw new Error('This session is closed or belongs to another device. Connect Supabase for cross-device check-in.');
      const slot=Math.floor(Date.now()/3000);
      if(qr.slot!==slot && qr.slot!==slot-1) throw new Error('QR expired. Scan the current code.');
      const distance=haversine(position.lat,position.lon,session.lat,session.lon);
      if(distance>50) throw new Error(`You are ${Math.round(distance)}m away. Move within 50m of the selected classroom.`);
      const already=local.checkIns.some(c=>c.sessionId===session.id&&c.studentId===studentId);
      if(!already) local.checkIns.push({sessionId:session.id,studentId,time:new Date().toISOString(),distance});
      return {already,distance};
    },
  };
}
