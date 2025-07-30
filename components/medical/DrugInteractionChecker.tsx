'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DrugInteractionChecker() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>药物相互作用检查</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            药物相互作用检查功能正在升级维护中，敬请期待...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}