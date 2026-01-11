'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function LoginSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      router.push('/');
    }
  }, [router, searchParams]);

  return <p>Đang đăng nhập...</p>;
}

export default function LoginSuccess() {
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <LoginSuccessContent />
    </Suspense>
  );
}
