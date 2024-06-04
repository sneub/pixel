import pixel from '@/pixel';
import { auth } from '@/auth';
import { Identify } from './handle-identify';
import { SignIn } from './sign-in';

export interface Session {
  expires: string;
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  };
}

export default async function Home() {
  const session = (await auth()) as Session;

  // Track a server-side event
  pixel.track('Page view');

  return (
    <main className="flex min-h-screen flex-col items-center gap-10 mt-24">
      <h1 className="text-xl font-medium">
        Welcome to Pixel example project (with AuthJS)
      </h1>
      {session ? <Identify session={session} /> : <SignIn />}
    </main>
  );
}
