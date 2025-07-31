import { getUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ComplianceClient } from './compliance-client';

export default async function CompliancePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return <ComplianceClient user={user} />;
}