import SocialAuthHandler from '@/components/forms/SocialAuthHandler';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SocialAuthHandler />
    </Suspense>
  );
}