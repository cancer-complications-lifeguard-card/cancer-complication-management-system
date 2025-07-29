import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ResourceDashboardClient } from './resource-dashboard-client';

export default async function ResourceDashboard() {
  const session = await getSession();
  
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">医疗资源导航</h1>
        <p className="text-gray-600 mt-2">查找附近的医院、急诊科和专科医生</p>
      </div>
      
      <ResourceDashboardClient userId={session.user.id} />
    </div>
  );
}