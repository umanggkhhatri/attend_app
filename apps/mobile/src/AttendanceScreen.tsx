import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import {
  studentAnalytics,
  weeklyTrend,
  attendanceMath,
  type Snapshot,
  type Student,
} from '@oneattend/core';
import { C, S, Icon, Card, Section, Label, Badge, Button, Progress, Sheet } from './ui';
export default function AttendanceScreen({
  student,
  snapshot,
  unlocked,
  onUnlock,
}: {
  student: Student;
  snapshot: Snapshot;
  unlocked: boolean;
  onUnlock: () => void;
}) {
  const data = studentAnalytics(student.id, snapshot),
    trend = weeklyTrend(student.id, snapshot);
  const [selected, setSelected] = useState<string | null>(null),
    [miss, setMiss] = useState(1),
    [view, setView] = useState('Courses');
  const detail = data.find((c) => c.course.id === selected);
  const shortage = data.filter((c) => !c.eligible).length;
  if (!unlocked)
    return (
      <ScrollView contentContainerStyle={S.screen}>
        <View style={S.heading}>
          <Label>ONEATTEND INSIGHTS</Label>
          <Text style={S.title}>Clarity for{'\n'}every course.</Text>
          <Text style={S.subtitle}>Less uncertainty. More control over your semester.</Text>
        </View>
        <Card style={{ padding: 24 }}>
          <View style={S.heroIcon}>
            <Icon name="Activity" size={25} color={C.blue} />
          </View>
          <Text style={[S.cardTitle, { fontSize: 22, lineHeight: 31, marginTop: 24 }]}>
            Know early.{'\n'}Act with confidence.
          </Text>
          <Text style={[S.body, { marginTop: 13, marginBottom: 26 }]}>
            Your course-wise records, 75% eligibility alerts, recovery calculations, weekly trends,
            and what-if planner—all in one place.
          </Text>
          <View style={[S.between, { marginBottom: 23 }]}>
            <Text style={S.number}>
              ₹9<Text style={S.body}> / month</Text>
            </Text>
            <Badge tone="blue">Student membership</Badge>
          </View>
          <Button title="Unlock attendance insights" onPress={onUnlock} icon="Activity" />
          <Text style={S.footnote}>
            Have a demo code? Enter student123 on the next screen.{'\n'}Checking in to class remains
            free.
          </Text>
        </Card>
        <Card>
          <View style={S.inline}>
            <Icon name="ShieldCheck" color={C.green} size={19} />
            <Text style={S.text}>Free to check in. Always.</Text>
          </View>
          <Text style={[S.body, { marginTop: 10 }]}>
            You don’t need a membership to scan your classroom QR and mark attendance.
          </Text>
        </Card>
      </ScrollView>
    );
  return (
    <ScrollView contentContainerStyle={S.screen} showsVerticalScrollIndicator={false}>
      <View style={S.heading}>
        <Label>ONEATTEND INSIGHTS · DEMO UNLOCKED</Label>
        <Text style={S.title}>Your semester,{'\n'}in perspective.</Text>
        <Text style={S.subtitle}>12 teaching weeks · August onwards · 75% required</Text>
      </View>
      <View style={[S.between, { marginBottom: 23 }]}>
        <Badge tone={shortage ? 'amber' : 'green'}>
          {shortage ? `${shortage} courses need attention` : 'All courses on track'}
        </Badge>
        <Text style={S.tiny}>{data.length} courses</Text>
      </View>
      <View style={[S.inline, { gap: 8, marginBottom: 22 }]}>
        {['Courses', 'Trends', 'Calendar'].map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[
              S.tabPill,
              view === v && { backgroundColor: '#33425d', borderColor: '#536a92' },
            ]}
          >
            <Text style={[S.text, { fontSize: 11, color: view === v ? C.blue : C.muted }]}>
              {v}
            </Text>
          </Pressable>
        ))}
      </View>
      {view === 'Courses' && (
        <>
          {data.map((d) => (
            <Pressable
              key={d.course.id}
              onPress={() => {
                setSelected(d.course.id);
                setMiss(1);
              }}
            >
              <Card>
                <View style={S.between}>
                  <View style={[S.inline, { flex: 1, gap: 11 }]}>
                    <View style={[S.courseSymbol, { backgroundColor: d.course.color + '19' }]}>
                      <Text style={[S.text, { fontSize: 10, color: d.course.color }]}>
                        {d.course.short}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.courseCode}>{d.course.id}</Text>
                      <Text style={[S.text, { fontSize: 12, marginTop: 5 }]}>{d.course.name}</Text>
                    </View>
                  </View>
                  <Icon name="ChevronRight" size={17} />
                </View>
                <View style={[S.between, { marginTop: 23, alignItems: 'flex-end' }]}>
                  <Text style={S.number}>
                    {d.percentage.toFixed(1)}
                    <Text style={[S.text, { fontSize: 18, color: C.muted }]}>%</Text>
                  </Text>
                  <Text style={[S.body, { fontSize: 11 }]}>
                    {d.attended} of {d.total} classes
                  </Text>
                </View>
                <Progress value={d.percentage} color={d.eligible ? d.course.color : C.amber} />
                <View style={[S.between, { marginTop: 14 }]}>
                  <Badge tone={d.eligible ? 'green' : 'amber'}>
                    {d.eligible ? 'On track' : 'Below 75%'}
                  </Badge>
                  <Text style={[S.tiny, { fontSize: 9, color: d.eligible ? C.muted : C.amber }]}>
                    {d.needed ? `Attend next ${d.needed} to recover` : `Can miss ${d.canMiss} more`}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
          <Text style={S.footnote}>
            Recovery assumes every next class is attended.{'\n'}Future forecasts are estimates, not
            faculty-approved eligibility.
          </Text>
        </>
      )}
      {view === 'Trends' && (
        <>
          <Card>
            <Section title="Weekly attendance pulse" />
            <View style={styles.chart}>
              {trend.map((w, i) => (
                <View style={styles.barWrap} key={i}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(2, w.percentage * 1.3),
                        backgroundColor: w.eligible ? C.blue : C.amber,
                      },
                    ]}
                  />
                  <Text style={styles.barLabel}>{w.label}</Text>
                </View>
              ))}
            </View>
            <View style={[S.between, { marginTop: 17 }]}>
              <Text style={S.tiny}>12 teaching weeks</Text>
              <Text style={S.tiny}>Amber = below 75%</Text>
            </View>
          </Card>
          <Section title="Course comparison" />
          <Card>
            {data.map((d) => (
              <View key={d.course.id} style={{ marginBottom: 20 }}>
                <View style={S.between}>
                  <Text style={S.text}>
                    {d.course.short} <Text style={S.tiny}>{d.course.id}</Text>
                  </Text>
                  <Text style={[S.text, { color: d.eligible ? C.green : C.amber }]}>
                    {d.percentage.toFixed(1)}%
                  </Text>
                </View>
                <Progress value={d.percentage} color={d.course.color} />
              </View>
            ))}
          </Card>
          <Card>
            <Label>MONTHLY SUMMARY</Label>
            {['August', 'September', 'October'].map((month, m) => {
              const ss = snapshot.sessions.filter(
                (s) => s.status === 'closed' && new Date(s.date).getUTCMonth() === 7 + m,
              );
              const ids = new Set(ss.map((s) => s.id));
              const attended = new Set(
                snapshot.checkIns
                  .filter((c) => c.studentId === student.id && ids.has(c.sessionId))
                  .map((c) => c.sessionId),
              ).size;
              return (
                <View key={month} style={[S.between, { paddingVertical: 11 }]}>
                  <Text style={S.text}>{month}</Text>
                  <Text style={S.body}>
                    {attended}/{ss.length} ·{' '}
                    {ss.length ? ((attended / ss.length) * 100).toFixed(1) : 0}%
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}
      {view === 'Calendar' && (
        <>
          <Card>
            <Label>YOUR ATTENDANCE CALENDAR</Label>
            <Text style={S.cardTitle}>Recent class history</Text>
            <Text style={[S.body, { marginTop: 9, marginBottom: 15 }]}>
              Present and absent records by course. Cancelled sessions do not affect your
              percentage.
            </Text>
            {[...snapshot.sessions]
              .filter((s) => s.status !== 'open')
              .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
              .slice(0, 36)
              .map((s) => {
                const d = data.find((d) => d.course.id === s.courseId);
                const present = snapshot.checkIns.some(
                  (c) => c.studentId === student.id && c.sessionId === s.id,
                );
                return (
                  <Pressable
                    key={s.id}
                    style={[
                      S.between,
                      { paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
                    ]}
                    onPress={() => setSelected(s.courseId)}
                  >
                    <View>
                      <Text style={[S.text, { fontSize: 11 }]}>
                        {new Date(s.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          weekday: 'short',
                        })}
                      </Text>
                      <Text style={[S.tiny, { marginTop: 4 }]}>{d?.course.name}</Text>
                    </View>
                    <Badge
                      tone={s.status === 'cancelled' ? 'neutral' : present ? 'green' : 'amber'}
                    >
                      {s.status === 'cancelled' ? 'Cancelled' : present ? 'Present' : 'Absent'}
                    </Badge>
                  </Pressable>
                );
              })}
          </Card>
        </>
      )}
      <Sheet
        visible={!!detail}
        title={detail?.course.name ?? ''}
        subtitle={`${detail?.course.id} · Course details & recovery planner`}
        onClose={() => setSelected(null)}
      >
        {detail && (
          <>
            <View style={S.between}>
              <View>
                <Text style={[S.number, { fontSize: 43 }]}>{detail.percentage.toFixed(1)}%</Text>
                <Text style={S.metricLabel}>
                  {detail.attended} of {detail.total} classes attended
                </Text>
              </View>
              <Badge tone={detail.eligible ? 'green' : 'amber'}>
                {detail.eligible ? 'On track' : 'Needs attention'}
              </Badge>
            </View>
            <Progress value={detail.percentage} color={detail.course.color} />
            <View style={S.notice}>
              <Text style={[S.text, { fontSize: 12, color: detail.eligible ? C.green : C.amber }]}>
                {detail.needed
                  ? `Attend ${detail.needed} consecutive classes to reach 75%.`
                  : `You can miss ${detail.canMiss} future classes and stay at 75%.`}
              </Text>
              <Text style={[S.tiny, { marginTop: 7 }]}>
                {detail.needed
                  ? `At two lectures a week, recovery takes approximately ${Math.ceil(detail.needed / 2)} teaching weeks.`
                  : 'Recheck after each class—your allowance changes with attendance.'}
              </Text>
            </View>
            <Section title="What if I miss a class?" />
            <View style={[S.between, { marginVertical: 13 }]}>
              <Button title="−" secondary onPress={() => setMiss(Math.max(0, miss - 1))} />
              <Text style={S.text}>
                {miss} upcoming {miss === 1 ? 'class' : 'classes'}
              </Text>
              <Button title="+" secondary onPress={() => setMiss(Math.min(20, miss + 1))} />
            </View>
            <Card>
              <Text style={[S.number, { fontSize: 29 }]}>
                {attendanceMath(detail.attended, detail.total + miss).percentage.toFixed(1)}%
              </Text>
              <Text style={[S.body, { marginTop: 5 }]}>
                Projected attendance after missing {miss} classes.
              </Text>
              <Text style={[S.riskText, { marginTop: 10 }]}>
                {attendanceMath(detail.attended, detail.total + miss).eligible
                  ? 'Still above the threshold.'
                  : 'This would put you below the 75% requirement.'}
              </Text>
            </Card>
            <Section title="Recent records" />
            {[...detail.sessions]
              .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
              .slice(0, 10)
              .map((s) => {
                const p = snapshot.checkIns.some(
                  (c) => c.studentId === student.id && c.sessionId === s.id,
                );
                return (
                  <View
                    style={[
                      S.between,
                      { paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
                    ]}
                    key={s.id}
                  >
                    <Text style={S.body}>
                      {new Date(s.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                    <Badge tone={p ? 'green' : 'amber'}>{p ? 'Present' : 'Absent'}</Badge>
                  </View>
                );
              })}
          </>
        )}
      </Sheet>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 170,
    marginTop: 10,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  barWrap: { flex: 1, height: 145, justifyContent: 'flex-end', position: 'relative' },
  bar: { borderTopLeftRadius: 3, borderTopRightRadius: 3, opacity: 0.8 },
  barLabel: {
    position: 'absolute',
    bottom: -20,
    fontFamily: 'DMSans_400Regular',
    fontSize: 7,
    color: C.dim,
    width: '100%',
    textAlign: 'center',
  },
});
