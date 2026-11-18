import * as Location from 'expo-location';
/** Bound GPS acquisition so a failed sensor cannot leave the demo spinning forever. */
export async function freshLocation(): Promise<Location.LocationObject> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                'GPS is taking too long. Move near a window, check location services, and retry.',
              ),
            ),
          20000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
