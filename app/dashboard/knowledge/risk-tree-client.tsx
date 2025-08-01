'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, Shield, Zap, Info } from 'lucide-react';

// 风险等级定义
const RISK_LEVELS = {
  CRITICAL: { label: '危急', color: 'bg-red-100 border-red-500 text-red-900', icon: Zap, badgeVariant: 'destructive' as const },
  HIGH: { label: '高风险', color: 'bg-orange-100 border-orange-500 text-orange-900', icon: AlertTriangle, badgeVariant: 'destructive' as const },
  MEDIUM: { label: '中风险', color: 'bg-yellow-100 border-yellow-500 text-yellow-900', icon: Info, badgeVariant: 'secondary' as const },
  LOW: { label: '低风险', color: 'bg-green-100 border-green-500 text-green-900', icon: Shield, badgeVariant: 'outline' as const }
};

// 模拟的并发症风险数据
const RISK_COMPLICATIONS = [
  {
    id: 1,
    name: '感染风险',
    riskLevel: 'HIGH',
    probability: '30-40%',
    timeframe: '治疗期间',
    symptoms: ['发热', '寒战', '白细胞升高'],
    prevention: ['注意个人卫生', '避免人群聚集', '定期监测血常规'],
    description: '化疗期间免疫力下降导致的感染风险'
  },
  {
    id: 2,
    name: '血小板减少',
    riskLevel: 'CRITICAL',
    probability: '50-60%',
    timeframe: '化疗后7-14天',
    symptoms: ['出血倾向', '皮肤紫癜', '牙龈出血'],
    prevention: ['避免外伤', '软毛牙刷', '定期复查血常规'],
    description: '化疗药物抑制骨髓造血功能'
  },
  {
    id: 3,
    name: '恶心呕吐',
    riskLevel: 'MEDIUM',
    probability: '60-80%',
    timeframe: '治疗后24-48小时',
    symptoms: ['恶心', '呕吐', '食欲不振'],
    prevention: ['预防性用药', '少量多餐', '避免油腻食物'],
    description: '化疗药物刺激呕吐中枢'
  },
  {
    id: 4,
    name: '口腔溃疡',
    riskLevel: 'MEDIUM',
    probability: '40-50%',
    timeframe: '治疗后5-10天',
    symptoms: ['口腔疼痛', '溃疡', '吞咽困难'],
    prevention: ['口腔护理', '漱口液', '避免辛辣食物'],
    description: '化疗对口腔黏膜的损伤'
  },
  {
    id: 5,
    name: '脱发',
    riskLevel: 'LOW',
    probability: '80-90%',
    timeframe: '治疗后2-3周',
    symptoms: ['头发脱落', '眉毛稀疏'],
    prevention: ['温和洗护', '佩戴帽子', '心理支持'],
    description: '化疗对毛囊细胞的影响'
  },
  {
    id: 6,
    name: '外周神经病变',
    riskLevel: 'HIGH',
    probability: '20-30%',
    timeframe: '累积剂量相关',
    symptoms: ['手足麻木', '感觉异常', '疼痛'],
    prevention: ['避免接触冷物', '保暖', '定期评估'],
    description: '某些化疗药物对神经系统的毒性'
  }
];

export function RiskTreeClient() {
  const [selectedRisk, setSelectedRisk] = useState<number | null>(null);

  // 按风险等级分组
  const risksByLevel = {
    CRITICAL: RISK_COMPLICATIONS.filter(r => r.riskLevel === 'CRITICAL'),
    HIGH: RISK_COMPLICATIONS.filter(r => r.riskLevel === 'HIGH'),
    MEDIUM: RISK_COMPLICATIONS.filter(r => r.riskLevel === 'MEDIUM'),
    LOW: RISK_COMPLICATIONS.filter(r => r.riskLevel === 'LOW')
  };

  const handleRiskClick = (riskId: number) => {
    setSelectedRisk(selectedRisk === riskId ? null : riskId);
  };

  const selectedRiskData = selectedRisk ? RISK_COMPLICATIONS.find(r => r.id === selectedRisk) : null;

  return (
    <div className="space-y-4">
      {/* 风险等级图例 */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">风险等级</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(RISK_LEVELS).map(([key, level]) => {
            const Icon = level.icon;
            const count = risksByLevel[key as keyof typeof risksByLevel].length;
            return (
              <div key={key} className="flex items-center gap-2">
                <Icon className="h-3 w-3" style={{ color: level.color.includes('red') ? '#dc2626' : 
                  level.color.includes('orange') ? '#ea580c' :
                  level.color.includes('yellow') ? '#ca8a04' : '#16a34a' }} />
                <span>{level.label}</span>
                <span className="text-gray-500">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 风险列表 */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {RISK_COMPLICATIONS.map((risk) => {
          const config = RISK_LEVELS[risk.riskLevel as keyof typeof RISK_LEVELS];
          const Icon = config.icon;
          const isSelected = selectedRisk === risk.id;
          
          return (
            <Card 
              key={risk.id} 
              className={`cursor-pointer transition-all border-2 ${
                isSelected ? 'ring-2 ring-blue-500 ' + config.color : 'hover:shadow-md ' + config.color
              }`}
              onClick={() => handleRiskClick(risk.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{risk.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.badgeVariant} className="text-xs">
                      {config.label}
                    </Badge>
                    <span className="text-xs text-gray-500">{risk.probability}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 详细信息展示 */}
      {selectedRiskData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-blue-900">{selectedRiskData.name}</h4>
                <p className="text-sm text-blue-800 mt-1">{selectedRiskData.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-xs text-blue-700 mb-1">主要症状</h5>
                  <div className="flex flex-wrap gap-1">
                    {selectedRiskData.symptoms.map((symptom, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-xs text-blue-700 mb-1">预防措施</h5>
                  <ul className="text-xs text-blue-800 space-y-0.5">
                    {selectedRiskData.prevention.map((measure, index) => (
                      <li key={index}>• {measure}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-blue-600">
                <span>发生概率: {selectedRiskData.probability}</span>
                <span>发生时间: {selectedRiskData.timeframe}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部统计 */}
      <div className="text-xs text-gray-500 text-center">
        共识别 {RISK_COMPLICATIONS.length} 种常见并发症风险
      </div>
    </div>
  );
}