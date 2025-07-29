import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { HealthDashboardClient } from './health-dashboard-client';

export default async function HealthDashboard() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">个人健康档案</h1>
        <p className="text-gray-600 mt-2">管理您的药物、病历记录和症状追踪</p>
      </div>
      
      <HealthDashboardClient userId={session.user.id} />
    </div>
  );
}