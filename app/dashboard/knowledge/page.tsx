import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MedicalTermsClient } from './medical-terms-client';
import { RiskTreeClient } from './risk-tree-client';

export default async function KnowledgePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">知识图谱中心</h1>
          <p className="text-gray-600 mt-2">
            探索医疗术语百科和并发症风险树，获取专业的医疗知识
          </p>
        </div>
        
        {/* 基础功能区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 医疗术语百科 */}
          <Card>
            <CardHeader>
              <CardTitle>医疗术语百科</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">查找医学术语和专业名词的详细解释</p>
              <MedicalTermsClient />
            </CardContent>
          </Card>

          {/* 并发症风险树 */}
          <Card>
            <CardHeader>
              <CardTitle>并发症风险树</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">查看各种症状的风险等级和关联分析</p>
              <RiskTreeClient />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}