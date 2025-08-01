'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, X, AlertTriangle, AlertCircle, Info, CheckCircle, Pill } from 'lucide-react';

// 风险等级定义
const INTERACTION_LEVELS = {
  MAJOR: { 
    label: '严重', 
    color: 'bg-red-100 text-red-800 border-red-200', 
    icon: AlertTriangle,
    description: '避免同时使用，可能导致严重不良反应'
  },
  MODERATE: { 
    label: '中度', 
    color: 'bg-orange-100 text-orange-800 border-orange-200', 
    icon: AlertCircle,
    description: '需要监测，可能需要调整剂量或时间'
  },
  MINOR: { 
    label: '轻微', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    icon: Info,
    description: '通常不需要特殊处理，注意观察'
  },
  SAFE: { 
    label: '安全', 
    color: 'bg-green-100 text-green-800 border-green-200', 
    icon: CheckCircle,
    description: '无已知相互作用，可以安全使用'
  }
};

// 模拟药物数据库
const DRUG_DATABASE = [
  { id: 1, name: '华法林', category: '抗凝药', commonName: 'Warfarin' },
  { id: 2, name: '阿司匹林', category: '抗血小板药', commonName: 'Aspirin' },
  { id: 3, name: '氨氯地平', category: '钙通道阻滞剂', commonName: 'Amlodipine' },
  { id: 4, name: '美托洛尔', category: 'β受体阻滞剂', commonName: 'Metoprolol' },
  { id: 5, name: '辛伐他汀', category: '他汀类', commonName: 'Simvastatin' },
  { id: 6, name: '奥美拉唑', category: '质子泵抑制剂', commonName: 'Omeprazole' },
  { id: 7, name: '地高辛', category: '强心苷', commonName: 'Digoxin' },
  { id: 8, name: '胺碘酮', category: '抗心律失常药', commonName: 'Amiodarone' },
  { id: 9, name: '环孢素', category: '免疫抑制剂', commonName: 'Cyclosporine' },
  { id: 10, name: '苯妥英钠', category: '抗癫痫药', commonName: 'Phenytoin' },
  { id: 11, name: '卡马西平', category: '抗癫痫药', commonName: 'Carbamazepine' },
  { id: 12, name: '利福平', category: '抗结核药', commonName: 'Rifampin' }
];

// 模拟相互作用数据
const INTERACTION_DATA = [
  {
    drug1: 1, drug2: 2, // 华法林 + 阿司匹林
    level: 'MAJOR',
    mechanism: '增强抗凝作用',
    clinicalEffect: '出血风险显著增加',
    management: '避免同时使用，如必须使用需密切监测凝血功能',
    references: ['药典2020版', 'FDA安全通信']
  },
  {
    drug1: 1, drug2: 6, // 华法林 + 奥美拉唑
    level: 'MODERATE',
    mechanism: '抑制CYP2C19酶活性',
    clinicalEffect: '华法林血药浓度增加，抗凝作用增强',
    management: '开始或停止奥美拉唑时需要监测INR，可能需要调整华法林剂量',
    references: ['临床药理学杂志']
  },
  {
    drug1: 3, drug2: 4, // 氨氯地平 + 美托洛尔
    level: 'MINOR',
    mechanism: '协同降压作用',
    clinicalEffect: '血压下降更明显',
    management: '监测血压，注意低血压症状',
    references: ['高血压指南2023']
  },
  {
    drug1: 5, drug2: 6, // 辛伐他汀 + 奥美拉唑
    level: 'SAFE',
    mechanism: '无显著相互作用',
    clinicalEffect: '无临床相关影响',
    management: '可以安全同时使用',
    references: ['药物相互作用手册']
  },
  {
    drug1: 7, drug2: 8, // 地高辛 + 胺碘酮
    level: 'MAJOR',
    mechanism: '胺碘酮抑制地高辛的肾清除',
    clinicalEffect: '地高辛血药浓度增加，中毒风险',
    management: '地高辛剂量减半，密切监测血药浓度',
    references: ['心脏病学年鉴']
  },
  {
    drug1: 9, drug2: 11, // 环孢素 + 卡马西平
    level: 'MAJOR',
    mechanism: '卡马西平诱导CYP3A4酶',
    clinicalEffect: '环孢素血药浓度降低，免疫抑制效果减弱',
    management: '避免同时使用，如必须使用需要增加环孢素剂量并监测血药浓度',
    references: ['器官移植杂志']
  }
];

export function DrugInteractionClient() {
  const [selectedDrugs, setSelectedDrugs] = useState<typeof DRUG_DATABASE>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<typeof DRUG_DATABASE>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 搜索药物
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsSearching(value.length > 0);
    
    if (value.trim()) {
      const results = DRUG_DATABASE.filter(drug =>
        drug.name.toLowerCase().includes(value.toLowerCase()) ||
        drug.commonName.toLowerCase().includes(value.toLowerCase()) ||
        drug.category.toLowerCase().includes(value.toLowerCase())
      );
      setSearchResults(results.slice(0, 5)); // 限制显示5个结果
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // 添加药物
  const addDrug = (drug: typeof DRUG_DATABASE[0]) => {
    if (!selectedDrugs.find(d => d.id === drug.id)) {
      const newSelectedDrugs = [...selectedDrugs, drug];
      setSelectedDrugs(newSelectedDrugs);
      checkInteractions(newSelectedDrugs);
    }
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // 移除药物
  const removeDrug = (drugId: number) => {
    const newSelectedDrugs = selectedDrugs.filter(d => d.id !== drugId);
    setSelectedDrugs(newSelectedDrugs);
    checkInteractions(newSelectedDrugs);
  };

  // 检查相互作用
  const checkInteractions = (drugs: typeof DRUG_DATABASE) => {
    const foundInteractions: Array<{
      drug1: number;
      drug2: number;
      level: string;
      mechanism: string;
      clinicalEffect: string;
      management: string;
      references: string[];
      drug1Info: typeof DRUG_DATABASE[0];
      drug2Info: typeof DRUG_DATABASE[0];
    }> = [];
    
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drug1Id = drugs[i].id;
        const drug2Id = drugs[j].id;
        
        // 查找相互作用（双向查找）
        const interaction = INTERACTION_DATA.find(inter => 
          (inter.drug1 === drug1Id && inter.drug2 === drug2Id) ||
          (inter.drug1 === drug2Id && inter.drug2 === drug1Id)
        );
        
        if (interaction) {
          foundInteractions.push({
            ...interaction,
            drug1Info: drugs[i],
            drug2Info: drugs[j]
          });
        }
      }
    }
    
    setInteractions(foundInteractions);
  };

  // 清空所有药物
  const clearAllDrugs = () => {
    setSelectedDrugs([]);
    setInteractions([]);
  };

  return (
    <div className="space-y-6">
      {/* 药物搜索和添加 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            添加药物
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="搜索药物名称（如：华法林、阿司匹林）..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
              
              {/* 搜索结果下拉 */}
              {isSearching && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                  {searchResults.map((drug) => (
                    <div
                      key={drug.id}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => addDrug(drug)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{drug.name}</div>
                          <div className="text-sm text-gray-500">{drug.commonName} • {drug.category}</div>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 已选择的药物 */}
            {selectedDrugs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">已选择的药物 ({selectedDrugs.length})</span>
                  <Button variant="outline" size="sm" onClick={clearAllDrugs}>
                    清空全部
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedDrugs.map((drug) => (
                    <Badge
                      key={drug.id}
                      variant="secondary"
                      className="px-3 py-1 text-sm"
                    >
                      {drug.name}
                      <button
                        onClick={() => removeDrug(drug.id)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 相互作用检查结果 */}
      {selectedDrugs.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              相互作用检查结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interactions.length > 0 ? (
                interactions.map((interaction, index) => {
                  const levelConfig = INTERACTION_LEVELS[interaction.level as keyof typeof INTERACTION_LEVELS];
                  const Icon = levelConfig.icon;
                  
                  return (
                    <Alert key={index} className={`border-2 ${levelConfig.color}`}>
                      <Icon className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-semibold">
                                {interaction.drug1Info.name} + {interaction.drug2Info.name}
                              </div>
                              <Badge className={levelConfig.color}>
                                {levelConfig.label}风险
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-700">作用机制</div>
                              <div className="text-gray-600">{interaction.mechanism}</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700">临床表现</div>
                              <div className="text-gray-600">{interaction.clinicalEffect}</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-700 mb-1">处理建议</div>
                            <div className="text-gray-600">{interaction.management}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-700 mb-1">参考文献</div>
                            <div className="text-xs text-gray-500">
                              {interaction.references.join(', ')}
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })
              ) : (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="font-medium mb-1">无发现显著相互作用</div>
                    <div className="text-sm">
                      在我们的数据库中，所选药物之间未发现已知的显著相互作用。
                      但仍建议在医生指导下用药，并注意观察身体反应。
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用提示 */}
      {selectedDrugs.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Info className="h-12 w-12 text-blue-600 mx-auto" />
              <div className="text-blue-900 font-medium">开始检查药物相互作用</div>
              <div className="text-blue-700 text-sm">
                请在上方搜索框中输入药物名称，添加您正在服用或计划服用的药物。
                系统将自动检查它们之间的相互作用风险。
              </div>
              <div className="text-blue-600 text-xs">
                💡 提示：至少添加2种药物才能进行相互作用检查
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 免责声明 */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-xs text-gray-600 space-y-2">
            <div className="font-medium">⚠️ 重要声明</div>
            <div>
              本系统提供的药物相互作用信息仅供参考，不能替代专业医疗建议。
              用药前请务必咨询医生或药师，特别是在以下情况：
            </div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>开始新药物治疗或停止现有药物时</li>
              <li>出现不明原因的症状或不良反应时</li>
              <li>有多种慢性疾病或正在服用多种药物时</li>
              <li>怀孕、哺乳或儿童用药时</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}