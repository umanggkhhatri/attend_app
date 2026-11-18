import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(process.cwd());
async function main() {
  await sharp(resolve(root, 'apps/mobile/assets/icon.svg'))
    .png()
    .toFile(resolve(root, 'apps/mobile/assets/icon.png'));
  await sharp(resolve(root, 'apps/mobile/assets/adaptive.svg'))
    .png()
    .toFile(resolve(root, 'apps/mobile/assets/adaptive.png'));
  const fonts = resolve(root, 'apps/web/public/fonts');
  await mkdir(fonts, { recursive: true });
  for (const [family, weight, file] of [
    ['dm-sans', '400Regular', 'DMSans_400Regular.ttf'],
    ['dm-sans', '500Medium', 'DMSans_500Medium.ttf'],
    ['dm-sans', '600SemiBold', 'DMSans_600SemiBold.ttf'],
    ['manrope', '600SemiBold', 'Manrope_600SemiBold.ttf'],
    ['manrope', '700Bold', 'Manrope_700Bold.ttf'],
  ])
    await copyFile(
      resolve(root, `node_modules/@expo-google-fonts/${family}/${weight}/${file}`),
      resolve(fonts, file),
    );
  for (const family of ['dm-sans', 'manrope'])
    await copyFile(
      resolve(root, `node_modules/@expo-google-fonts/${family}/LICENSE_FONT`),
      resolve(fonts, `LICENSE-${family}.txt`),
    );
  console.log('Generated Android icon assets and bundled web fonts.');
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
