import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { EmergencyDashboardClient } from './emergency-dashboard-client';

export default async function EmergencyDashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }

  return <EmergencyDashboardClient userId={session.userId} />;
}