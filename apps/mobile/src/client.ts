import { createGateway } from '@oneattend/core';
export const gateway = createGateway(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
