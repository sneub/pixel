import { ClientButton } from './client-button';
import pixel from '@/pixel';

export default function Home() {
  // Track a server-side event
  pixel.track('Page view');

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 mt-24">
      <h1 className="text-xl font-medium">
        Welcome to Pixel example project (simple)
      </h1>
      <ClientButton />
    </main>
  );
}
