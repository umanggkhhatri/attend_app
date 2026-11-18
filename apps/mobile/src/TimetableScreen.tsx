import { useState } from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { courses, schedule } from '@oneattend/core';
import { C, S, Card, Label, Icon, Badge, Button } from './ui';
export default function TimetableScreen({
  onBack,
  onCheckIn,
}: {
  onBack: () => void;
  onCheckIn: () => void;
}) {
  const [day, setDay] = useState('Mon');
  return (
    <ScrollView contentContainerStyle={S.screen}>
      <Pressable style={[S.inline, { marginBottom: 19 }]} onPress={onBack}>
        <Icon name="ChevronRight" size={15} />
        <Text style={S.textLink}>Back to home</Text>
      </Pressable>
      <View style={S.heading}>
        <Label>PLAN YOUR WEEK</Label>
        <Text style={S.title}>Room for{'\n'}a better day.</Text>
        <Text style={S.subtitle}>Combined AI + CS · Sample weekly timetable</Text>
      </View>
      <View style={[S.between, { marginBottom: 25 }]}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
          <Pressable
            key={d}
            onPress={() => setDay(d)}
            style={[
              S.tabPill,
              { paddingHorizontal: 12 },
              day === d && { backgroundColor: '#34435d', borderColor: '#53698d' },
            ]}
          >
            <Text style={[S.text, { fontSize: 11, color: day === d ? C.blue : C.muted }]}>{d}</Text>
          </Pressable>
        ))}
      </View>
      {schedule.map((s, i) => {
        const course =
          courses[
            (courses.findIndex((c) => c.id === s.courseId) +
              (['Tue', 'Thu'].includes(day) ? 2 : day === 'Fri' ? 1 : 0)) %
              courses.length
          ];
        return (
          <Card key={i}>
            <View style={S.between}>
              <Text style={[S.text, { fontSize: 12 }]}>
                {s.time} — {s.end}
              </Text>
              <Badge tone="blue">{s.kind}</Badge>
            </View>
            <View style={S.divider} />
            <Text style={[S.cardTitle, { fontSize: 16, lineHeight: 24 }]}>{course.name}</Text>
            <Text style={[S.tiny, { marginTop: 7 }]}>
              {course.id} · {course.teacher}
            </Text>
            <View style={[S.inline, { marginTop: 14 }]}>
              <Icon name="MapPin" size={14} />
              <Text style={S.tiny}>{course.room}</Text>
            </View>
          </Card>
        );
      })}
      <Button title="Open attendance scanner" onPress={onCheckIn} icon="QrCode" />
      <Text style={S.footnote}>
        Timetable entries are sample data.{'\n'}Only a teacher-opened live session permits check-in.
      </Text>
    </ScrollView>
  );
}
