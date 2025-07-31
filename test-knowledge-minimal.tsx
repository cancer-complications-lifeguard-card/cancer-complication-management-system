'use client';

import { useState } from 'react';
import { User, ComplicationRiskTree } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Network, Search, Book } from 'lucide-react';

interface TestProps {
  user: User;
}

export function TestKnowledgeGraphClient({ user }: TestProps) {
  const [riskTree, setRiskTree] = useState<ComplicationRiskTree[]>([]);

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Test Knowledge Graph
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Book className="h-5 w-5 text-blue-500" />
            <span>Medical Terms: 1250</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Network className="h-5 w-5 text-green-500" />
            <span>Risk Trees: {riskTree.length}</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Search className="h-5 w-5 text-purple-500" />
            <span>Search Functionality</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}