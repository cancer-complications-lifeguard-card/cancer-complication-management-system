'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function KnowledgeBaseDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">医疗知识库</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>知识库功能</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            医疗知识库功能正在升级维护中，敬请期待...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}