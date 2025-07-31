import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ComplianceClient } from './compliance-client';

export default async function CompliancePage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/sign-in');
  }

  return <ComplianceClient user={session.user} />;
}