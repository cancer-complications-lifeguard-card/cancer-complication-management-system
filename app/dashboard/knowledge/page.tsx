import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { KnowledgeGraphClient } from './knowledge-graph-client';

export default async function KnowledgePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">知识图谱中心</h1>
          <p className="text-gray-600 mt-2">
            探索医疗术语百科和并发症风险树，获取专业的医疗知识
          </p>
        </div>
        
        <KnowledgeGraphClient user={user} />
      </div>
    </div>
  );
}