import { redirect } from 'next/navigation';

/** Legacy entry point — the app now lives under /dashboard. */
export default function AppHome() {
  redirect('/dashboard');
}
