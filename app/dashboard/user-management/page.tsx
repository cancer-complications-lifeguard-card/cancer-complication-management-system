import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { UserManagementClient } from './user-management-client';

export default async function UserManagementPage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-2">
            管理您的用户身份、状态和医疗档案信息
          </p>
        </div>
        
        <UserManagementClient user={user} />
      </div>
    </div>
  );
}