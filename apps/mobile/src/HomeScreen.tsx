import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { courses, schedule, studentAnalytics, type Student, type Snapshot } from '@oneattend/core';
import { C, S, Icon, Label, Badge, Card, Button, Section, Progress } from './ui';
export default function HomeScreen({
  student,
  snapshot,
  unlocked,
  connected,
  onNavigate,
  onUnlock,
}: {
  student: Student;
  snapshot: Snapshot;
  unlocked: boolean;
  connected: boolean;
  onNavigate: (s: string) => void;
  onUnlock: () => void;
}) {
  const data = studentAnalytics(student.id, snapshot);
  const attended = data.reduce((n, c) => n + c.attended, 0),
    total = data.reduce((n, c) => n + c.total, 0);
  const shortage = data.filter((c) => !c.eligible).length;
  const active = snapshot.sessions.find((s) => s.status === 'open');
  const activeCourse = courses.find((c) => c.id === active?.courseId);
  return (
    <ScrollView contentContainerStyle={S.screen} showsVerticalScrollIndicator={false}>
      <View style={S.heading}>
        <Label>YEAR 3 · SEMESTER 1</Label>
        <Text style={S.title}>
          Good to see you,{'\n'}
          {student.name.split(' ')[0]}.
        </Text>
        <Text style={S.subtitle}>Your classes. Your progress. Your campus.</Text>
      </View>
      <View style={[S.between, { marginBottom: 18 }]}>
        <Text style={S.tiny}>
          {student.id} · {student.batch} batch
        </Text>
        <Badge tone={connected ? 'green' : 'amber'}>
          {connected ? 'Live connected' : 'Sample preview'}
        </Badge>
      </View>
      {active && (
        <Pressable onPress={() => onNavigate('scan')} style={styles.liveBanner}>
          <View style={S.inline}>
            <View style={styles.liveDot} />
            <Text style={[S.text, { fontSize: 11, color: C.green }]}>Attendance is open</Text>
          </View>
          <Text style={[S.cardTitle, { marginTop: 9 }]}>{activeCourse?.name}</Text>
          <View style={[S.between, { marginTop: 9 }]}>
            <Text style={S.tiny}>50m classroom boundary · Scan to check in</Text>
            <Icon name="ArrowRight" size={16} color={C.green} />
          </View>
        </Pressable>
      )}
      <Card style={{ padding: 21 }}>
        <View style={S.between}>
          <View style={S.inline}>
            <Icon name="Activity" size={17} color={C.blue} />
            <Text style={[S.text, { fontSize: 12 }]}>Your attendance, at a glance</Text>
          </View>
          <Icon name={unlocked ? 'ArrowUpRight' : 'ShieldCheck'} size={17} color={C.blue} />
        </View>
        {unlocked ? (
          <>
            <View style={[S.between, { marginTop: 21, alignItems: 'flex-end' }]}>
              <View>
                <Text style={[S.number, { fontSize: 43 }]}>
                  {total ? ((attended / total) * 100).toFixed(1) : '0'}
                  <Text style={[S.number, { fontSize: 21, color: C.muted }]}>%</Text>
                </Text>
                <Text style={S.metricLabel}>
                  Overall · {attended} of {total} classes
                </Text>
              </View>
              <Badge tone={shortage ? 'amber' : 'green'}>
                {shortage ? `${shortage} courses need attention` : 'All courses on track'}
              </Badge>
            </View>
            <Progress value={total ? (attended / total) * 100 : 0} />
            <Text style={[S.tiny, { marginTop: 13 }]}>
              Eligibility is assessed per course, not on this overall average.
            </Text>
            <View style={S.divider} />
            <Pressable style={S.between} onPress={() => onNavigate('attendance')}>
              <Text style={S.textLink}>Open course-wise insights</Text>
              <Icon name="ArrowRight" size={16} color={C.blue} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[S.cardTitle, { fontSize: 20, lineHeight: 28, marginTop: 20 }]}>
              No more guessing{'\n'}where you stand.
            </Text>
            <Text style={[S.body, { marginTop: 10, marginBottom: 20 }]}>
              Every subject. Early alerts. A clear recovery plan.{'\n'}Unlock attendance insights
              for ₹9/month.
            </Text>
            <Button title="Explore OneAttend Insights" onPress={onUnlock} icon="Activity" />
          </>
        )}
      </Card>
      <Section
        title="Today’s classes"
        action="Timetable"
        onAction={() => onNavigate('timetable')}
      />
      <Card style={{ paddingVertical: 3 }}>
        {schedule.slice(0, 3).map((item, i) => {
          const course = courses.find((c) => c.id === item.courseId)!;
          return (
            <Pressable
              key={item.courseId}
              style={[
                styles.classRow,
                i < 2 && { borderBottomWidth: 1, borderBottomColor: C.line },
              ]}
              onPress={() => onNavigate('timetable')}
            >
              <View style={styles.time}>
                <Text style={styles.timeText}>{item.time}</Text>
                <Text style={[S.tiny, { fontSize: 9 }]}>{item.end}</Text>
              </View>
              <View style={[styles.classRule, { backgroundColor: course.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[S.text, { fontSize: 12 }]}>{course.name}</Text>
                <Text style={[S.tiny, { marginTop: 5, fontSize: 9 }]}>
                  {course.id} · Room {201 + courses.indexOf(course)}
                </Text>
              </View>
              <Icon name="ChevronRight" size={15} />
            </Pressable>
          );
        })}
      </Card>
      <Section
        title="Campus, made simpler"
        action="Explore"
        onAction={() => onNavigate('campus')}
      />
      <View style={styles.quickGrid}>
        {[
          { title: 'Share a cab', sub: 'Find your way home', icon: 'Car' as const, id: 'rides' },
          {
            title: 'Gate passes',
            sub: 'Skip the paperwork',
            icon: 'Ticket' as const,
            id: 'passes',
          },
          {
            title: 'Hostel help',
            sub: 'Report & track',
            icon: 'Wrench' as const,
            id: 'complaints',
          },
          {
            title: 'Campus updates',
            sub: 'Stay in the loop',
            icon: 'Megaphone' as const,
            id: 'announcements',
          },
        ].map((item) => (
          <Pressable
            key={item.title}
            onPress={() => onNavigate('campus:' + item.id)}
            style={styles.quickCard}
          >
            <View style={styles.quickIcon}>
              <Icon name={item.icon} size={19} color={C.blue} />
            </View>
            <Text style={[S.text, { fontSize: 11, marginTop: 14 }]}>{item.title}</Text>
            <Text style={[S.tiny, { fontSize: 9, marginTop: 5 }]}>{item.sub}</Text>
          </Pressable>
        ))}
      </View>
      <Section title="On the noticeboard" />
      <Pressable onPress={() => onNavigate('campus:announcements')}>
        <Card>
          <View style={[S.between, { marginBottom: 12 }]}>
            <Badge tone="blue">Academic</Badge>
            <Text style={[S.tiny, { fontSize: 9 }]}>Sample notice</Text>
          </View>
          <Text style={S.cardTitle}>Mid-semester assessment schedule</Text>
          <Text style={[S.body, { marginTop: 8 }]}>
            A little planning goes a long way. Your sample assessment dates are on the academic
            calendar.
          </Text>
          <View style={[S.inline, { marginTop: 15 }]}>
            <Text style={S.textLink}>View campus notices</Text>
            <Icon name="ArrowRight" size={13} color={C.blue} />
          </View>
        </Card>
      </Pressable>
      <Text style={S.footnote}>
        A clearer picture. Every class.{'\n'}Fictional campus & student data for demonstration.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  liveBanner: {
    padding: 17,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b5b49',
    backgroundColor: '#26362d',
    marginBottom: 17,
  },
  liveDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: C.green },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 },
  time: { width: 43 },
  timeText: { fontFamily: 'DMSans_500Medium', fontSize: 11, color: C.text, marginBottom: 4 },
  classRule: { width: 3, height: 33, borderRadius: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    padding: 17,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#314058',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
