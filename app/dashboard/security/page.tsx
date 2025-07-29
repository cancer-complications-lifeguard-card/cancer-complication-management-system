import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { SecurityDashboardClient } from './security-dashboard-client';

export default async function SecurityDashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }

  return <SecurityDashboardClient userId={session.userId} userRole={session.userRole} />;
}