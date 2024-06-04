'use client';

import { usePixel } from '@pixel/nextjs';

export function ClientButton() {
  const { track } = usePixel();

  const handleClick = () => {
    // Track a client side event
    track('Awesome event');
  };

  return (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={handleClick}
    >
      Click me
    </button>
  );
}
