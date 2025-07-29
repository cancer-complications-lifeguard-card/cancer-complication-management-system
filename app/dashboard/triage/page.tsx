import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { TriageDashboardClient } from './triage-dashboard-client';

export default async function TriageDashboard() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">智能分诊系统</h1>
        <p className="text-gray-600 mt-2">多模态症状分析和风险评估</p>
      </div>
      
      <TriageDashboardClient userId={session.user.id} />
    </div>
  );
}