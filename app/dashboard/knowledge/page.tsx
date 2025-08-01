import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { Settings, Clock, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function KnowledgePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">知识图谱中心</h1>
          <p className="text-gray-600 mt-2">
            探索医疗术语百科和并发症风险树，获取专业的医疗知识
          </p>
        </div>
        
        {/* 维护状态显示 */}
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50">
          <CardContent className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Settings className="h-16 w-16 text-orange-500 animate-spin" />
                <Wrench className="h-8 w-8 text-orange-600 absolute -bottom-1 -right-1" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-orange-800 mb-4">
              功能正在升级维护中
            </h2>
            
            <p className="text-orange-700 text-lg mb-6">
              敬请期待...
            </p>
            
            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              <span className="text-sm">
                我们正在为您带来更好的知识图谱体验
              </span>
            </div>
            
            <div className="mt-8 p-4 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-700">
                在此期间，您可以使用其他功能模块：
                健康档案、症状监测、应急处理等
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}