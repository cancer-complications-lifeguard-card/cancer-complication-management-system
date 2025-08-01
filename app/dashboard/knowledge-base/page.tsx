import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KnowledgeBaseClient } from './knowledge-base-client';

export default async function KnowledgeBasePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">医疗知识库</h1>
          <p className="text-gray-600 mt-2">
            NCCN指南、医学文献、治疗方案和专业资料库
          </p>
        </div>
        
        <KnowledgeBaseClient />
      </div>
    </div>
  );
}