'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { X, Plus, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DrugInteraction {
  id: number;
  drugA: string;
  drugB: string;
  severity: string;
  description: string;
  clinicalEffect?: string;
  mechanism?: string;
  management?: string;
  references?: string;
}

export default function DrugInteractionChecker() {
  const [drugs, setDrugs] = useState<string[]>(['', '']);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const addDrug = () => {
    if (drugs.length < 10) {
      setDrugs([...drugs, '']);
    }
  };

  const removeDrug = (index: number) => {
    if (drugs.length > 2) {
      const newDrugs = drugs.filter((_, i) => i !== index);
      setDrugs(newDrugs);
    }
  };

  const updateDrug = (index: number, value: string) => {
    const newDrugs = [...drugs];
    newDrugs[index] = value;
    setDrugs(newDrugs);
  };

  const checkInteractions = async () => {
    const validDrugs = drugs.filter(drug => drug.trim()).map(drug => drug.trim());
    
    if (validDrugs.length < 2) {
      toast.error('请至少输入2个药物名称');
      return;
    }

    setLoading(true);
    setHasChecked(false);

    try {
      const response = await fetch('/api/knowledge-base/drug-interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drugs: validDrugs
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInteractions(data.data);
        setHasChecked(true);
        
        if (data.data.length === 0) {
          toast.success('未发现药物相互作用');
        } else {
          const majorCount = data.data.filter((i: DrugInteraction) => i.severity === 'major').length;
          const contraindicatedCount = data.data.filter((i: DrugInteraction) => i.severity === 'contraindicated').length;
          
          if (contraindicatedCount > 0) {
            toast.error(`发现 ${contraindicatedCount} 个禁忌组合和 ${data.data.length} 个总交互`);
          } else if (majorCount > 0) {
            toast.warning(`发现 ${majorCount} 个严重交互和 ${data.data.length} 个总交互`);
          } else {
            toast.info(`发现 ${data.data.length} 个药物交互`);
          }
        }
      } else {
        toast.error('检查失败，请重试');
      }
    } catch (error) {
      console.error('Drug interaction check error:', error);
      toast.error('检查失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return 'destructive';
      case 'major': return 'destructive';
      case 'moderate': return 'default';
      case 'minor': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return <XCircle className=\"h-4 w-4\" />;
      case 'major': return <AlertTriangle className=\"h-4 w-4\" />;
      case 'moderate': return <Info className=\"h-4 w-4\" />;
      case 'minor': return <CheckCircle2 className=\"h-4 w-4\" />;
      default: return <Info className=\"h-4 w-4\" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'contraindicated': return '禁忌';
      case 'major': return '严重';
      case 'moderate': return '中度';
      case 'minor': return '轻微';
      default: return severity;
    }
  };

  return (
    <div className=\"space-y-6\">
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <AlertTriangle className=\"h-5 w-5 mr-2\" />
            药物相互作用检查
          </CardTitle>
          <CardDescription>
            输入多个药物名称检查潜在的相互作用风险
          </CardDescription>
        </CardHeader>
        <CardContent className=\"space-y-4\">
          {/* Drug Input Section */}
          <div className=\"space-y-3\">
            <div className=\"flex items-center justify-between\">
              <label className=\"text-sm font-medium\">药物列表 (至少2个):</label>
              <Button 
                variant=\"outline\" 
                size=\"sm\" 
                onClick={addDrug}
                disabled={drugs.length >= 10}
              >
                <Plus className=\"h-4 w-4 mr-1\" />
                添加药物
              </Button>
            </div>

            {drugs.map((drug, index) => (
              <div key={index} className=\"flex items-center space-x-2\">
                <div className=\"flex-1\">
                  <Input
                    placeholder={`药物 ${index + 1} (例如: 阿司匹林)`}
                    value={drug}
                    onChange={(e) => updateDrug(index, e.target.value)}
                  />
                </div>
                {drugs.length > 2 && (
                  <Button
                    variant=\"outline\"
                    size=\"sm\"
                    onClick={() => removeDrug(index)}
                  >
                    <X className=\"h-4 w-4\" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className=\"flex justify-center pt-4\">
            <Button 
              onClick={checkInteractions} 
              disabled={loading}
              size=\"lg\"
              className=\"w-full max-w-xs\"
            >
              {loading ? '检查中...' : '检查药物交互'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasChecked && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <span>检查结果</span>
              <Badge variant=\"outline\">
                {interactions.length} 个交互
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interactions.length === 0 ? (
              <Alert>
                <CheckCircle2 className=\"h-4 w-4\" />
                <AlertDescription>
                  未发现药物相互作用。所输入的药物组合看起来是安全的。
                </AlertDescription>
              </Alert>
            ) : (
              <div className=\"space-y-4\">
                <Alert className=\"border-amber-200 bg-amber-50\">
                  <AlertTriangle className=\"h-4 w-4\" />
                  <AlertDescription>
                    发现 {interactions.length} 个药物相互作用。请仔细阅读以下信息并咨询医疗专业人士。
                  </AlertDescription>
                </Alert>

                <div className=\"space-y-4\">
                  {interactions.map((interaction) => (
                    <Card key={interaction.id} className=\"border-l-4 border-l-red-500\">
                      <CardHeader className=\"pb-3\">
                        <div className=\"flex items-start justify-between\">
                          <div className=\"flex-1\">
                            <CardTitle className=\"text-lg flex items-center\">
                              {getSeverityIcon(interaction.severity)}
                              <span className=\"ml-2\">
                                {interaction.drugA} ↔ {interaction.drugB}
                              </span>
                            </CardTitle>
                          </div>
                          <Badge variant={getSeverityColor(interaction.severity)} className=\"ml-2\">
                            {getSeverityText(interaction.severity)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className=\"space-y-3\">
                        <div>
                          <h4 className=\"font-medium mb-1\">交互描述:</h4>
                          <p className=\"text-sm text-gray-700\">{interaction.description}</p>
                        </div>

                        {interaction.clinicalEffect && (
                          <>
                            <Separator />
                            <div>
                              <h4 className=\"font-medium mb-1\">临床效应:</h4>
                              <p className=\"text-sm text-gray-700\">{interaction.clinicalEffect}</p>
                            </div>
                          </>
                        )}

                        {interaction.mechanism && (
                          <>
                            <Separator />
                            <div>
                              <h4 className=\"font-medium mb-1\">作用机制:</h4>
                              <p className=\"text-sm text-gray-700\">{interaction.mechanism}</p>
                            </div>
                          </>
                        )}

                        {interaction.management && (
                          <>
                            <Separator />
                            <div>
                              <h4 className=\"font-medium mb-1 text-blue-700\">管理建议:</h4>
                              <p className=\"text-sm text-blue-700 font-medium\">{interaction.management}</p>
                            </div>
                          </>
                        )}

                        {interaction.references && (
                          <>
                            <Separator />
                            <div>
                              <h4 className=\"font-medium mb-1 text-xs text-gray-500\">参考文献:</h4>
                              <p className=\"text-xs text-gray-500\">{interaction.references}</p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert className=\"border-blue-200 bg-blue-50\">
                  <Info className=\"h-4 w-4\" />
                  <AlertDescription>
                    <strong>重要提醒:</strong> 此工具仅供参考，不能替代专业医疗建议。
                    如有药物相互作用疑虑，请咨询您的医生或药剂师。
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}