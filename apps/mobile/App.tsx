import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  AppState,
  Platform,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { students, history, type Student, type Snapshot } from '@oneattend/core';
import { C, S, Icon, Sheet, Button, Label, Badge, type IconName } from './src/ui';
import HomeScreen from './src/HomeScreen';
import AttendanceScreen from './src/AttendanceScreen';
import CampusScreen from './src/CampusScreen';
import ScannerScreen from './src/ScannerScreen';
import TimetableScreen from './src/TimetableScreen';
import { gateway } from './src/client';
void SplashScreen.preventAutoHideAsync().catch(() => {});
const tabs: { id: string; name: string; icon: IconName }[] = [
  { id: 'home', name: 'Home', icon: 'Home' },
  { id: 'attendance', name: 'Attendance', icon: 'Activity' },
  { id: 'scan', name: 'Check in', icon: 'QrCode' },
  { id: 'campus', name: 'Campus', icon: 'GraduationCap' },
  { id: 'profile', name: 'Profile', icon: 'User' },
];
export default function App() {
  const [fonts, error] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  useEffect(() => {
    if (fonts || error) void SplashScreen.hideAsync().catch(() => {});
  }, [fonts, error]);
  if (!fonts && !error)
    return (
      <View
        style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color={C.blue} />
      </View>
    );
  return (
    <SafeAreaProvider style={{ backgroundColor: Platform.OS === 'web' ? '#10141b' : C.bg }}>
      <StatusBar style="light" />
      <StudentApp />
    </SafeAreaProvider>
  );
}
function StudentApp() {
  const insets = useSafeAreaInsets();
  const [student, setStudent] = useState<Student>(students[0]),
    [tab, setTab] = useState('home'),
    [campusService, setCampusService] = useState<string | null>(null),
    [selector, setSelector] = useState(false),
    [query, setQuery] = useState(''),
    [snapshot, setSnapshot] = useState<Snapshot>(history),
    [unlocked, setUnlocked] = useState(false),
    [membership, setMembership] = useState(false),
    [code, setCode] = useState(''),
    [codeError, setCodeError] = useState(''),
    [connected, setConnected] = useState(false),
    [toast, setToast] = useState(''),
    [guide, setGuide] = useState(false);
  const lastError = useRef('');
  useEffect(() => {
    void (async () => {
      try {
        const id = await AsyncStorage.getItem('oneattend-student');
        if (id && students.some((s) => s.id === id)) setStudent(students.find((s) => s.id === id)!);
      } catch {
        setToast('Could not restore the selected demo student.');
      }
    })();
  }, []);
  useEffect(() => {
    let alive = true;
    setUnlocked(false);
    void AsyncStorage.getItem('oneattend-member-' + student.id)
      .then((v) => {
        if (alive) setUnlocked(v === 'demo');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [student.id]);
  useEffect(() => {
    let alive = true;
    setSnapshot(history);
    async function refresh() {
      try {
        const data = await gateway.snapshot({ studentId: student.id });
        if (alive) {
          setSnapshot(data);
          setConnected(gateway.live);
          lastError.current = '';
        }
      } catch (e) {
        if (alive) {
          setConnected(false);
          if (lastError.current !== (e as Error).message) {
            lastError.current = (e as Error).message;
            setToast('Live connection unavailable. Showing the last available records.');
          }
        }
      }
    }
    void refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [student.id]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const go = (id: string) => {
    if (id.startsWith('campus:')) {
      setCampusService(id.split(':')[1]);
      setTab('campus');
      return;
    }
    if (id === 'campus') setCampusService(null);
    setTab(id);
  };
  const select = async (s: Student) => {
    setUnlocked(false);
    setStudent(s);
    setSelector(false);
    setQuery('');
    setTab('home');
    try {
      await AsyncStorage.setItem('oneattend-student', s.id);
    } catch {
      setToast('Selection changed, but could not be saved.');
    }
  };
  const unlock = async () => {
    if (code.trim() !== 'student123') {
      setCodeError('That demo code is not valid. Try student123.');
      return;
    }
    try {
      await AsyncStorage.setItem('oneattend-member-' + student.id, 'demo');
      setUnlocked(true);
      setMembership(false);
      setCode('');
      setCodeError('');
      setToast('Attendance insights unlocked for this demo student.');
    } catch {
      setCodeError('Could not save the demo unlock. Please retry.');
    }
  };
  const refresh = async () => {
    try {
      setSnapshot(await gateway.snapshot({ studentId: student.id }));
    } catch {
      setToast('Check-in saved, but the latest report could not be loaded yet.');
    }
  };
  return (
    <View
      style={[
        S.root,
        { paddingTop: insets.top },
        Platform.OS === 'web' && { width: '100%', maxWidth: 430, alignSelf: 'center' },
      ]}
    >
      <View style={styles.appTop}>
        <Pressable
          onPress={() => setTab('home')}
          style={S.inline}
          accessibilityLabel="OneAttend home"
        >
          <View style={styles.brandIcon}>
            <Icon name="CheckCheck" size={20} color="#1d2b45" />
          </View>
          <Text style={styles.brand}>
            OneAttend<Text style={{ color: C.blue }}>.</Text>
          </Text>
        </Pressable>
        <View style={[S.inline, { gap: 17 }]}>
          <Pressable onPress={() => setGuide(true)} accessibilityLabel="Demo information">
            <Icon name="Bell" size={19} />
            <View style={styles.dot} />
          </Pressable>
          <Pressable
            onPress={() => setSelector(true)}
            accessibilityLabel="Choose demo student"
            style={S.avatar}
          >
            <Text style={S.avatarText}>
              {student.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </Text>
          </Pressable>
        </View>
      </View>
      {tab === 'home' && (
        <HomeScreen
          student={student}
          snapshot={snapshot}
          unlocked={unlocked}
          connected={connected}
          onNavigate={go}
          onUnlock={() => setMembership(true)}
        />
      )}
      {tab === 'attendance' && (
        <AttendanceScreen
          student={student}
          snapshot={snapshot}
          unlocked={unlocked}
          onUnlock={() => setMembership(true)}
        />
      )}
      {tab === 'scan' && (
        <ScannerScreen
          student={student}
          onDone={() => {
            void refresh();
          }}
          onToast={setToast}
        />
      )}
      {tab === 'campus' && (
        <CampusScreen
          student={student}
          initialService={campusService}
          onTimetable={() => go('timetable')}
        />
      )}
      {tab === 'timetable' && (
        <TimetableScreen onBack={() => go('home')} onCheckIn={() => go('scan')} />
      )}
      {tab === 'profile' && (
        <ScrollView contentContainerStyle={S.screen}>
          <View style={S.heading}>
            <Label>YOUR WORKSPACE</Label>
            <Text style={S.title}>Made for your day.</Text>
            <Text style={S.subtitle}>A little less admin. A little more campus life.</Text>
          </View>
          <View style={[S.card, { alignItems: 'center', paddingVertical: 27 }]}>
            <View style={[S.avatar, { width: 60, height: 60, borderRadius: 30 }]}>
              <Text style={[S.avatarText, { fontSize: 19 }]}>
                {student.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
            <Text style={[S.cardTitle, { marginTop: 15 }]}>{student.name}</Text>
            <Text style={[S.tiny, { marginTop: 7 }]}>
              {student.id} ·{' '}
              {student.batch === 'AI' ? 'Artificial Intelligence' : 'Computer Science'}
            </Text>
            <Text style={[S.tiny, { marginTop: 4 }]}>Year 3 · Semester 1</Text>
            <View style={{ marginTop: 15 }}>
              <Badge tone="blue">Fictional demo student</Badge>
            </View>
          </View>
          <View style={S.card}>
            <View style={S.between}>
              <View>
                <Text style={S.cardTitle}>OneAttend Insights</Text>
                <Text style={[S.tiny, { marginTop: 6 }]}>
                  {unlocked
                    ? 'Demo membership unlocked'
                    : 'Attendance records & full course analytics'}
                </Text>
              </View>
              <Text style={[S.cardTitle, { color: C.blue }]}>
                ₹9<Text style={S.tiny}> / mo</Text>
              </Text>
            </View>
            <View style={S.divider} />
            <Button
              title={unlocked ? 'View attendance insights' : 'Explore membership'}
              onPress={() => (unlocked ? go('attendance') : setMembership(true))}
              icon="Activity"
            />
          </View>
          <Pressable style={S.touchRow} onPress={() => setSelector(true)}>
            <Icon name="Users" />
            <Text style={[S.text, { flex: 1 }]}>Switch demo student</Text>
            <Icon name="ChevronRight" size={17} />
          </Pressable>
          <Pressable style={S.touchRow} onPress={() => setGuide(true)}>
            <Icon name="ShieldCheck" />
            <Text style={[S.text, { flex: 1 }]}>Privacy & demo information</Text>
            <Icon name="ChevronRight" size={17} />
          </Pressable>
          <Pressable
            style={S.touchRow}
            onPress={() => {
              setUnlocked(false);
              void AsyncStorage.removeItem('oneattend-member-' + student.id);
              setToast('Demo membership reset for this student.');
            }}
          >
            <Icon name="Activity" />
            <Text style={[S.text, { flex: 1 }]}>Reset demo membership</Text>
            <Icon name="ChevronRight" size={17} />
          </Pressable>
          <Text style={S.footnote}>
            OneAttend · Presentation build 0.1.0{'\n'}Sample campus data. No real payment
            processing.
          </Text>
        </ScrollView>
      )}
      <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {tabs.map((t) => (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
            accessibilityLabel={t.name}
            onPress={() => go(t.id)}
            style={styles.tab}
          >
            {t.id === 'scan' ? (
              <View
                style={[styles.scanTab, { backgroundColor: tab === 'scan' ? '#adc4f3' : C.blue }]}
              >
                <Icon name="QrCode" size={22} color="#22324f" />
              </View>
            ) : (
              <Icon name={t.icon} color={tab === t.id ? C.blue : '#788496'} size={21} />
            )}
            <Text style={[styles.tabLabel, { color: tab === t.id ? C.blue : '#8691a3' }]}>
              {t.name}
            </Text>
          </Pressable>
        ))}
      </View>
      {toast && (
        <Pressable
          onPress={() => setToast('')}
          style={[styles.toast, { bottom: 85 + insets.bottom }]}
          accessibilityRole="alert"
        >
          <Icon name="Info" color={C.blue} size={17} />
          <Text style={styles.toastText}>{toast}</Text>
        </Pressable>
      )}
      <Sheet
        visible={selector}
        title="Choose a demo student"
        subtitle="152 fictional students · AI and CS · Year 3"
        onClose={() => setSelector(false)}
      >
        <View style={[S.inline, S.input, { marginBottom: 18 }]}>
          <Icon name="Search" size={17} />
          <TextInput
            style={{ flex: 1, color: C.text, fontFamily: 'DMSans_400Regular', fontSize: 12 }}
            placeholder="Name or roll number"
            placeholderTextColor={C.dim}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {students
          .filter((s) => `${s.id} ${s.name}`.toLowerCase().includes(query.toLowerCase()))
          .map((s) => (
            <Pressable key={s.id} style={S.row} onPress={() => void select(s)}>
              <View style={S.avatar}>
                <Text style={S.avatarText}>
                  {s.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.text}>{s.name}</Text>
                <Text style={[S.tiny, { marginTop: 4 }]}>
                  {s.id} · {s.batch}
                </Text>
              </View>
              {student.id === s.id && <Icon name="Check" color={C.blue} size={18} />}
            </Pressable>
          ))}
      </Sheet>
      <Sheet
        visible={membership}
        title="Know where you stand."
        subtitle="OneAttend Insights · ₹9 / month"
        onClose={() => setMembership(false)}
      >
        <View style={styles.membershipPrice}>
          <Text style={[S.number, { fontSize: 48 }]}>
            ₹9<Text style={S.body}> / month</Text>
          </Text>
          <Badge tone="blue">Student membership</Badge>
        </View>
        {[
          'Every course, one clear attendance record',
          '75% eligibility alerts & recovery calculations',
          'Weekly trends, history & attendance calendar',
          'Safe-to-miss counts & what-if analysis',
        ].map((t) => (
          <View style={[S.inline, { marginBottom: 17 }]} key={t}>
            <Icon name="Check" color={C.green} size={17} />
            <Text style={[S.body, { color: '#c6d0df', flex: 1 }]}>{t}</Text>
          </View>
        ))}
        <View style={S.notice}>
          <Text style={[S.text, { fontSize: 11, color: C.blue }]}>
            Presentation demo · no payment required
          </Text>
          <Text style={[S.tiny, { marginTop: 5 }]}>
            Enter student123 to explore the complete experience. This is a demo unlock, not a
            subscription purchase.
          </Text>
        </View>
        <TextInput
          autoCapitalize="none"
          placeholder="Enter demo access code"
          placeholderTextColor={C.dim}
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setCodeError('');
          }}
          style={[S.input, { marginBottom: 12 }]}
        />
        {codeError && <Text style={[S.riskText, { marginBottom: 12 }]}>{codeError}</Text>}
        <Button title="Unlock demo insights" onPress={() => void unlock()} icon="Activity" />
        <Text style={S.footnote}>QR check-in and campus services remain free.</Text>
      </Sheet>
      <Sheet
        visible={guide}
        title="A thoughtful campus demo."
        subtitle="What is live, what is sample, and what comes next."
        onClose={() => setGuide(false)}
      >
        <Label>LIVE ATTENDANCE</Label>
        <Text style={S.body}>
          When Supabase is connected, QR check-ins use your actual location and update the teacher
          dashboard. A session closes manually, marking remaining students absent.
        </Text>
        <View style={S.divider} />
        <Label>SAMPLE CAMPUS WORKFLOWS</Label>
        <Text style={S.body}>
          Cab sharing, gate passes, complaints, leave requests, menus, notices and directory entries
          are sample interactions. They do not create real bookings, permissions or messages.
        </Text>
        <View style={S.divider} />
        <Label>PRIVACY & LIMITATIONS</Label>
        <Text style={S.body}>
          Location is requested only in the check-in screen. The backend stores the verification
          distance, not precise student coordinates. Demo identities are selectable, not
          authenticated. GPS can be spoofed; this demo is not a guarantee of proxy prevention.
        </Text>
        <View style={S.divider} />
        <Badge tone={connected ? 'green' : 'amber'}>
          {connected ? 'Supabase connected' : 'Sample preview · no cross-device syncing'}
        </Badge>
      </Sheet>
    </View>
  );
}
const styles = StyleSheet.create({
  appTop: {
    height: 72,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: { fontFamily: 'Manrope_700Bold', fontSize: 21, color: C.text, letterSpacing: -0.8 },
  brandIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.blue,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tabbar: {
    backgroundColor: '#1e222a',
    borderTopWidth: 1,
    borderTopColor: '#303743',
    flexDirection: 'row',
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 7, minHeight: 43 },
  tabLabel: { fontFamily: 'DMSans_500Medium', fontSize: 9 },
  scanTab: {
    width: 44,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -5,
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#303e53',
    borderWidth: 1,
    borderColor: '#50698e',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toastText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#dbe6f6',
    lineHeight: 17,
    flex: 1,
  },
  membershipPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
});
