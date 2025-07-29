import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { MonitoringDashboardClient } from './monitoring-dashboard-client';

export default async function MonitoringDashboard() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">生命体征监测</h1>
        <p className="text-gray-600 mt-2">实时监控您的健康状态和设备连接</p>
      </div>
      
      <MonitoringDashboardClient userId={session.user.id} />
    </div>
  );
}