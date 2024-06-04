'use client';

import { useEffect } from 'react';
import { usePixel } from '@pixel/nextjs';
import { Session } from './page';

export function Identify({ session }: { session: Session }) {
  const { identify } = usePixel();

  useEffect(() => {
    identify({
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
  }, [session]);

  return <div>Identified 🤝</div>;
}
