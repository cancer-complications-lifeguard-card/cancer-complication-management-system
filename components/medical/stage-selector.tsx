'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserStage } from '@/lib/db/schema';
import { medicalConfig } from '@/lib/config';

interface StageSelectorProps {
  currentStage: UserStage;
  onStageChange: (stage: UserStage) => Promise<void>;
  disabled?: boolean;
}

const stageConfig = {
  [UserStage.DAILY]: {
    title: medicalConfig.stages.daily,
    description: '日常健康管理，预防并发症发生',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '🌟'
  },
  [UserStage.INQUIRY]: {
    title: medicalConfig.stages.inquiry,
    description: '症状查询和健康评估',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: '🔍'
  },
  [UserStage.ONSET]: {
    title: medicalConfig.stages.onset,
    description: '紧急医疗处理和救治指导',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '🚨'
  }
};

export function StageSelector({ currentStage, onStageChange, disabled = false }: StageSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStageChange = async (stage: UserStage) => {
    if (stage === currentStage || disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onStageChange(stage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>当前状态</span>
          <Badge variant="secondary" className={stageConfig[currentStage].color}>
            {stageConfig[currentStage].icon} {stageConfig[currentStage].title}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {Object.entries(stageConfig).map(([stage, config]) => {
            const stageEnum = stage as UserStage;
            const isActive = stageEnum === currentStage;
            
            return (
              <Button
                key={stage}
                variant={isActive ? "default" : "outline"}
                className={`justify-start p-4 h-auto ${isActive ? config.color : ''}`}
                onClick={() => handleStageChange(stageEnum)}
                disabled={disabled || isLoading}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-lg">{config.icon}</span>
                    {config.title}
                    {isActive && <Badge variant="secondary" size="sm">当前</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}