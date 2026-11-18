import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { type Student, type Position } from '@oneattend/core';
import { gateway } from './client';
import { freshLocation } from './location';
import { C, S, Label, Icon, Badge, Button, Card } from './ui';
export default function ScannerScreen({
  student,
  onDone,
  onToast,
}: {
  student: Student;
  onDone: () => void;
  onToast: (s: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationReady, setLocationReady] = useState(false),
    [locationError, setLocationError] = useState(''),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<{ already: boolean; distance: number } | null>(null),
    [error, setError] = useState(''),
    [manual, setManual] = useState(''),
    [attempt, setAttempt] = useState(0);
  const gps = useRef<Position | null>(null),
    lock = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (result) return;
    let cancelled = false;
    let watch: Location.LocationSubscription | undefined;
    gps.current = null;
    setLocationReady(false);
    setLocationError('');
    async function start() {
      try {
        const p = await Location.requestForegroundPermissionsAsync();
        if (p.status !== 'granted') {
          if (!cancelled)
            setLocationError(
              'Location permission is required to verify the 50m classroom boundary.',
            );
          return;
        }
        const first = await freshLocation();
        if (cancelled) return;
        gps.current = {
          lat: first.coords.latitude,
          lon: first.coords.longitude,
          accuracy: first.coords.accuracy ?? 999,
          timestamp: first.timestamp,
        };
        setLocationReady(true);
        watch = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 0 },
          (p) => {
            if (!cancelled) {
              gps.current = {
                lat: p.coords.latitude,
                lon: p.coords.longitude,
                accuracy: p.coords.accuracy ?? 999,
                timestamp: p.timestamp,
              };
              setLocationReady(true);
            }
          },
        );
        if (cancelled) watch.remove();
      } catch (e) {
        if (!cancelled)
          setLocationError(
            (e as Error).message || 'Could not obtain your location. Turn on GPS and retry.',
          );
      }
    }
    void start();
    return () => {
      cancelled = true;
      watch?.remove();
      gps.current = null;
    };
  }, [attempt, !!result]);
  async function scan(payload: string) {
    if (lock.current || !gps.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      let position = gps.current;
      if (Date.now() - position.timestamp > 20000) {
        const p = await freshLocation();
        position = {
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          accuracy: p.coords.accuracy ?? 999,
          timestamp: p.timestamp,
        };
        gps.current = position;
      }
      const data = await gateway.mark(payload, student.id, position);
      if (alive.current) {
        setResult(data);
        onDone();
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  const retry = () => {
    lock.current = false;
    setResult(null);
    setError('');
    setManual('');
  };
  if (result)
    return (
      <ScrollView contentContainerStyle={[S.screen, { paddingTop: 25 }]}>
        <Label>CLASSROOM CHECK-IN</Label>
        <Text style={S.title}>
          {result.already ? 'Already accounted for.' : 'You’re accounted for.'}
        </Text>
        <Text style={S.subtitle}>
          {result.already
            ? 'Your attendance was already recorded for this session.'
            : 'Your attendance has been saved to this classroom session.'}
        </Text>
        <Card style={{ alignItems: 'center', paddingVertical: 35, marginTop: 30 }}>
          <View style={styles.successIcon}>
            <Icon name="CheckCheck" size={34} color={C.green} />
          </View>
          <Text style={[S.cardTitle, { fontSize: 20, marginTop: 22 }]}>
            {result.already ? 'Already checked in' : 'Check-in successful'}
          </Text>
          <Text style={[S.body, { marginTop: 11 }]}>
            {student.name} · {student.id}
          </Text>
          <View style={{ marginTop: 18 }}>
            <Badge tone="green">
              Within 50m · {Math.round(result.distance)}m verified distance
            </Badge>
          </View>
          <Text style={[S.tiny, { textAlign: 'center', marginTop: 22, lineHeight: 20 }]}>
            {gateway.live ? 'Saved to the live demo backend.' : 'Saved in this local preview only.'}
            {'\n'}Your precise GPS coordinates are not stored.
          </Text>
        </Card>
        <Button title="Scan another session" onPress={retry} icon="QrCode" />
        <Text style={S.footnote}>Check-in is free. Attendance insights require membership.</Text>
      </ScrollView>
    );
  return (
    <ScrollView contentContainerStyle={S.screen}>
      <View style={S.heading}>
        <Label>FREE CLASSROOM CHECK-IN</Label>
        <Text style={S.title}>Be here.{'\n'}Be accounted for.</Text>
        <Text style={S.subtitle}>Scan the teacher’s live QR inside the classroom.</Text>
      </View>
      <View style={[S.between, { marginBottom: 20 }]}>
        <Badge tone={locationReady ? 'green' : 'amber'}>
          {locationReady ? 'GPS ready' : 'Waiting for location'}
        </Badge>
        <Badge tone="blue">50m geofence</Badge>
      </View>
      {!gateway.live && (
        <View style={[S.notice, { marginTop: 0 }]}>
          <Text style={S.tiny}>
            Supabase is not configured. Cross-device check-in is unavailable until the app and
            teacher dashboard use the same project.
          </Text>
        </View>
      )}
      {locationError && (
        <Card>
          <Text style={[S.body, { color: C.amber }]}>{locationError}</Text>
          <View style={{ marginTop: 15 }}>
            <Button title="Retry location" onPress={() => setAttempt((a) => a + 1)} icon="MapPin" />
          </View>
        </Card>
      )}
      {permission?.granted && locationReady ? (
        <View style={styles.cameraBox}>
          {!error && !busy && (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => void scan(data)}
            />
          )}
          <View pointerEvents="none" style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              <View
                style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]}
              />
              <View
                style={[
                  styles.corner,
                  { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
                ]}
              />
            </View>
            <Text style={styles.scanHint}>Align the QR inside the frame</Text>
          </View>
          {busy && (
            <View style={styles.busyOverlay}>
              <ActivityIndicator color={C.blue} />
              <Text style={[S.text, { marginTop: 18 }]}>Verifying check-in…</Text>
            </View>
          )}
          {error && (
            <View style={styles.busyOverlay}>
              <Icon name="Info" color={C.amber} size={27} />
              <Text
                style={[
                  S.body,
                  { textAlign: 'center', color: '#e4d7c1', marginTop: 14, paddingHorizontal: 20 },
                ]}
              >
                {error}
              </Text>
              <View style={{ marginTop: 23 }}>
                <Button title="Scan again" onPress={retry} />
              </View>
            </View>
          )}
        </View>
      ) : (
        <Card style={{ alignItems: 'center', paddingVertical: 34 }}>
          <Icon name="QrCode" size={43} color={C.blue} />
          <Text style={[S.cardTitle, { marginTop: 20 }]}>
            {!permission?.granted ? 'Camera access needed' : 'Getting a fresh GPS reading'}
          </Text>
          <Text style={[S.body, { textAlign: 'center', marginTop: 12, marginBottom: 23 }]}>
            Your camera scans the classroom QR.{'\n'}Location verifies that you’re near the selected
            classroom.
          </Text>
          {!permission?.granted ? (
            <Button
              title={permission?.canAskAgain === false ? 'Open app settings' : 'Allow camera'}
              onPress={() => {
                if (permission?.canAskAgain === false) {
                  if (Platform.OS === 'web')
                    onToast('Allow camera permission in your browser settings.');
                  else void Linking.openSettings();
                } else void requestPermission();
              }}
              icon="QrCode"
            />
          ) : (
            <ActivityIndicator color={C.blue} />
          )}
        </Card>
      )}
      <Card style={{ marginTop: 21 }}>
        <View style={[S.inline, { marginBottom: 12 }]}>
          <Icon name="ShieldCheck" color={C.blue} size={18} />
          <Text style={[S.text, { fontSize: 12 }]}>A quick, verified check-in</Text>
        </View>
        {[
          'QR rotates every 3 seconds. Scan the current code.',
          'Stay within 50 metres of the map-selected classroom.',
          'GPS must be fresh and reasonably accurate.',
          'Only one check-in is recorded per student, per session.',
        ].map((t, i) => (
          <View key={t} style={[S.inline, { alignItems: 'flex-start', marginBottom: 10 }]}>
            <Text style={[S.tiny, { color: C.blue, width: 16 }]}>{i + 1}.</Text>
            <Text style={[S.tiny, { flex: 1 }]}>{t}</Text>
          </View>
        ))}
      </Card>
      {Platform.OS === 'web' && (
        <Card>
          <Label>WEB PREVIEW ONLY</Label>
          <Text style={[S.tiny, { marginBottom: 12 }]}>
            Paste a fresh attendance QR payload to test without a camera. GPS is still verified.
          </Text>
          <TextInput
            value={manual}
            onChangeText={setManual}
            placeholder="QR payload JSON"
            placeholderTextColor={C.dim}
            multiline
            style={[S.input, { marginBottom: 12 }]}
          />
          <Button
            title="Verify pasted QR"
            disabled={!locationReady || !manual || busy}
            onPress={() => {
              lock.current = false;
              void scan(manual);
            }}
          />
        </Card>
      )}
      <Text style={S.footnote}>
        Location is accessed only while this screen is open.{'\n'}GPS verification is not protection
        against all spoofing.
      </Text>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  cameraBox: {
    height: 300,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#121820',
    borderWidth: 1,
    borderColor: '#475670',
  },
  cameraOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060b1525',
  },
  scanFrame: { width: 195, height: 195, position: 'relative' },
  corner: { width: 26, height: 26, position: 'absolute', borderColor: '#b9cff9' },
  scanHint: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    color: '#dce7f9',
    marginTop: 23,
    backgroundColor: '#162235b0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  busyOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#1a2433',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#2a4236',
    borderWidth: 1,
    borderColor: '#476653',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
