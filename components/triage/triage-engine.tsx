'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, MessageCircle, Mic, Camera, ArrowRight, Clock, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useForm } from 'react-hook-form';

interface SymptomAssessment {
  id: string;
  symptomDescription: string;
  severity: number;
  duration: string;
  onset: string;
  associatedSymptoms: string[];
  vitalSigns?: {
    temperature?: number;
    heartRate?: number;
    bloodPressure?: string;
  };
  painLevel?: number;
  activityLevel?: string;
  currentMedications: string[];
  recentTreatments: string[];
}

interface TriageResult {
  urgencyLevel: 'emergency' | 'urgent' | 'moderate' | 'low';
  riskScore: number;
  recommendations: string[];
  nextSteps: string[];
  estimatedWaitTime?: string;
  requiresEmergencyAction: boolean;
}

interface TriageEngineProps {
  userId: number;
}

interface TriageFormData {
  mainSymptom: string;
  symptomDescription: string;
  severity: string;
  duration: string;
  onset: string;
  painLevel: string;
  associatedSymptoms: string[];
  temperature: string;
  heartRate: string;
  bloodPressure: string;
  activityLevel: string;
  currentMedications: string;
  recentTreatments: string;
}

const urgencyLevels = {
  emergency: {
    label: '紧急',
    color: 'bg-red-100 text-red-800 border-red-200',
    description: '立即就医',
    icon: '🚨',
  },
  urgent: {
    label: '急迫',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    description: '2-4小时内就医',
    icon: '⚡',
  },
  moderate: {
    label: '中等',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    description: '24小时内就医',
    icon: '⚠️',
  },
  low: {
    label: '轻微',
    color: 'bg-green-100 text-green-800 border-green-200',
    description: '观察或预约就医',
    icon: '💡',
  },
};

const commonSymptoms = [
  '胸痛', '呼吸困难', '头痛', '腹痛', '发热', '恶心呕吐', '咳嗽', '疲劳',
  '头晕', '出血', '皮疹', '关节疼痛', '便血', '尿血', '意识改变', '其他'
];

const emergencySymptoms = [
  '严重胸痛', '呼吸极度困难', '意识丧失', '大量出血', '严重头痛伴呕吐',
  '突然言语不清', '面部下垂', '肢体无力', '严重腹痛', '高热不退'
];

export function TriageEngine({ userId }: TriageEngineProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice' | 'image'>('text');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<TriageFormData>();

  const calculateRiskScore = (data: TriageFormData): TriageResult => {
    let riskScore = 0;
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // Emergency symptom check
    if (emergencySymptoms.some(symptom => data.symptomDescription.includes(symptom))) {
      riskScore += 100;
    }

    // Severity scoring
    const severity = parseInt(data.severity);
    if (severity >= 8) riskScore += 40;
    else if (severity >= 6) riskScore += 25;
    else if (severity >= 4) riskScore += 15;
    else riskScore += 5;

    // Vital signs scoring
    if (data.temperature) {
      const temp = parseFloat(data.temperature);
      if (temp >= 39) riskScore += 20;
      else if (temp >= 38) riskScore += 10;
      else if (temp <= 35) riskScore += 15;
    }

    if (data.heartRate) {
      const hr = parseInt(data.heartRate);
      if (hr > 120 || hr < 50) riskScore += 20;
      else if (hr > 100 || hr < 60) riskScore += 10;
    }

    // Duration scoring
    if (data.duration === 'sudden' || data.duration === 'worsening') {
      riskScore += 20;
    }

    // Activity level impact
    if (data.activityLevel === 'unable') riskScore += 25;
    else if (data.activityLevel === 'limited') riskScore += 15;
    else if (data.activityLevel === 'reduced') riskScore += 10;

    // Pain level
    const painLevel = parseInt(data.painLevel || '0');
    if (painLevel >= 8) riskScore += 20;
    else if (painLevel >= 6) riskScore += 10;

    // Associated symptoms
    if (data.associatedSymptoms.length >= 3) riskScore += 15;
    else if (data.associatedSymptoms.length >= 2) riskScore += 10;

    // Determine urgency level
    let urgencyLevel: TriageResult['urgencyLevel'];
    let requiresEmergencyAction = false;

    if (riskScore >= 80) {
      urgencyLevel = 'emergency';
      requiresEmergencyAction = true;
      recommendations.push('立即拨打120急救电话');
      recommendations.push('前往最近的急诊科');
      recommendations.push('准备病历和身份证件');
      nextSteps.push('立即行动，不要拖延');
      nextSteps.push('如有家人陪同更好');
    } else if (riskScore >= 60) {
      urgencyLevel = 'urgent';
      recommendations.push('尽快前往医院急诊科');
      recommendations.push('联系主治医生');
      recommendations.push('监测症状变化');
      nextSteps.push('2-4小时内就医');
      nextSteps.push('准备详细症状描述');
    } else if (riskScore >= 30) {
      urgencyLevel = 'moderate';
      recommendations.push('24小时内就医');
      recommendations.push('可预约门诊或急诊');
      recommendations.push('密切观察症状');
      nextSteps.push('联系家庭医生或专科医生');
      nextSteps.push('记录症状发展');
    } else {
      urgencyLevel = 'low';
      recommendations.push('居家观察');
      recommendations.push('如症状加重及时就医');
      recommendations.push('保持休息和充足饮水');
      nextSteps.push('可预约常规门诊');
      nextSteps.push('继续监测症状');
    }

    return {
      urgencyLevel,
      riskScore: Math.min(riskScore, 100),
      recommendations,
      nextSteps,
      requiresEmergencyAction,
      estimatedWaitTime: urgencyLevel === 'emergency' ? '立即' : 
                        urgencyLevel === 'urgent' ? '30分钟' :
                        urgencyLevel === 'moderate' ? '2-4小时' : '预约时间',
    };
  };

  const handleTriageSubmit = async (data: TriageFormData) => {
    setIsAnalyzing(true);
    
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = calculateRiskScore(data);
    setTriageResult(result);
    setCurrentStep(3);
    setIsAnalyzing(false);

    // Save triage assessment
    try {
      await fetch('/api/triage-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          riskScore: result.riskScore,
          urgencyLevel: result.urgencyLevel,
        }),
      });
    } catch (error) {
      console.error('Error saving triage assessment:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= step 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <ArrowRight className={`h-4 w-4 mx-2 ${
                currentStep > step ? 'text-primary' : 'text-gray-400'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderInputModeSelector = () => (
    <div className="mb-4">
      <Label className="text-base font-medium mb-3 block">选择输入方式</Label>
      <div className="grid grid-cols-3 gap-2">
        <Button
          type="button"
          variant={inputMode === 'text' ? 'default' : 'outline'}
          onClick={() => setInputMode('text')}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          文字描述
        </Button>
        <Button
          type="button"
          variant={inputMode === 'voice' ? 'default' : 'outline'}
          onClick={() => setInputMode('voice')}
          className="flex items-center gap-2"
          disabled
        >
          <Mic className="h-4 w-4" />
          语音输入
        </Button>
        <Button
          type="button"
          variant={inputMode === 'image' ? 'default' : 'outline'}
          onClick={() => setInputMode('image')}
          className="flex items-center gap-2"
          disabled
        >
          <Camera className="h-4 w-4" />
          图片上传
        </Button>
      </div>
      <p className="text-sm text-gray-500 mt-2">语音和图片功能即将上线</p>
    </div>
  );

  const renderSymptomForm = () => (
    <form onSubmit={handleSubmit(handleTriageSubmit)} className="space-y-6">
      {renderInputModeSelector()}
      
      <div>
        <Label htmlFor="mainSymptom">主要症状 *</Label>
        <Select onValueChange={(value) => setValue('mainSymptom', value)}>
          <SelectTrigger>
            <SelectValue placeholder="选择主要症状" />
          </SelectTrigger>
          <SelectContent>
            {commonSymptoms.map((symptom) => (
              <SelectItem key={symptom} value={symptom}>
                {symptom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.mainSymptom && (
          <p className="text-sm text-red-600 mt-1">请选择主要症状</p>
        )}
      </div>

      <div>
        <Label htmlFor="symptomDescription">详细描述 *</Label>
        <Textarea
          id="symptomDescription"
          {...register('symptomDescription', { required: '请详细描述症状' })}
          placeholder="请详细描述您的症状，包括位置、性质、程度等"
          rows={4}
        />
        {errors.symptomDescription && (
          <p className="text-sm text-red-600 mt-1">{errors.symptomDescription.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>症状严重程度 (1-10) *</Label>
          <Select onValueChange={(value) => setValue('severity', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择严重程度" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  {level} - {level <= 3 ? '轻微' : level <= 6 ? '中等' : level <= 8 ? '严重' : '极严重'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>疼痛程度 (1-10)</Label>
          <Select onValueChange={(value) => setValue('painLevel', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择疼痛程度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">无疼痛</SelectItem>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                <SelectItem key={level} value={level.toString()}>
                  {level} - {level <= 3 ? '轻微' : level <= 6 ? '中等' : level <= 8 ? '严重' : '极严重'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>症状持续时间 *</Label>
          <Select onValueChange={(value) => setValue('duration', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择持续时间" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">几分钟</SelectItem>
              <SelectItem value="hours">几小时</SelectItem>
              <SelectItem value="days">几天</SelectItem>
              <SelectItem value="weeks">几周</SelectItem>
              <SelectItem value="months">几个月</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>症状发作方式</Label>
          <Select onValueChange={(value) => setValue('onset', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择发作方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sudden">突然发作</SelectItem>
              <SelectItem value="gradual">逐渐加重</SelectItem>
              <SelectItem value="intermittent">间歇性</SelectItem>
              <SelectItem value="constant">持续性</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>活动能力影响</Label>
        <Select onValueChange={(value) => setValue('activityLevel', value)}>
          <SelectTrigger>
            <SelectValue placeholder="选择活动能力影响" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">正常活动</SelectItem>
            <SelectItem value="reduced">活动减少</SelectItem>
            <SelectItem value="limited">明显受限</SelectItem>
            <SelectItem value="unable">无法活动</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>体温 (°C)</Label>
          <Input
            {...register('temperature')}
            type="number"
            step="0.1"
            placeholder="36.5"
          />
        </div>
        <div>
          <Label>心率 (次/分)</Label>
          <Input
            {...register('heartRate')}
            type="number"
            placeholder="80"
          />
        </div>
        <div>
          <Label>血压</Label>
          <Input
            {...register('bloodPressure')}
            placeholder="120/80"
          />
        </div>
      </div>

      <div>
        <Label>当前用药</Label>
        <Textarea
          {...register('currentMedications')}
          placeholder="请列出您正在服用的药物"
          rows={2}
        />
      </div>

      <div>
        <Label>近期治疗</Label>
        <Textarea
          {...register('recentTreatments')}
          placeholder="请描述近期接受的治疗或手术"
          rows={2}
        />
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(1)}
        >
          上一步
        </Button>
        <Button type="submit" disabled={isAnalyzing}>
          {isAnalyzing ? '分析中...' : '开始分析'}
        </Button>
      </div>
    </form>
  );

  const renderTriageResult = () => {
    if (!triageResult) return null;

    const urgencyInfo = urgencyLevels[triageResult.urgencyLevel];

    return (
      <div className="space-y-6">
        <Card className={`border-2 ${urgencyInfo.color.replace('bg-', 'border-').replace('100', '200')}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <span className="text-2xl">{urgencyInfo.icon}</span>
              分诊结果
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={`${urgencyInfo.color} text-lg px-4 py-2`}>
                  {urgencyInfo.label} - {urgencyInfo.description}
                </Badge>
                <div className="text-right">
                  <p className="text-sm text-gray-600">风险评分</p>
                  <p className="text-2xl font-bold">{triageResult.riskScore}/100</p>
                </div>
              </div>
              
              <Progress value={triageResult.riskScore} className="h-3" />

              {triageResult.requiresEmergencyAction && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">紧急情况</span>
                  </div>
                  <p className="text-red-700">您的症状可能需要紧急医疗处理，请立即行动！</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                建议行动
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {triageResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                下一步
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {triageResult.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {triageResult.requiresEmergencyAction && (
          <div className="flex gap-4">
            <Button className="flex-1 bg-red-600 hover:bg-red-700">
              <Phone className="h-4 w-4 mr-2" />
              拨打120急救
            </Button>
            <Button variant="outline" className="flex-1">
              <MapPin className="h-4 w-4 mr-2" />
              查找最近医院
            </Button>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentStep(1);
              setTriageResult(null);
            }}
          >
            重新评估
          </Button>
          <Button>
            保存结果
          </Button>
        </div>
      </div>
    );
  };

  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">AI分析中...</h3>
        <p className="text-gray-600">正在分析您的症状并评估风险等级</p>
        <div className="mt-4">
          <Progress value={75} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">智能分诊系统</h1>
        <p className="text-gray-600">基于症状描述提供专业的医疗建议和风险评估</p>
      </div>

      {renderStepIndicator()}

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>欢迎使用智能分诊</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              请准确描述您的症状，我们将为您提供专业的医疗建议。此系统仅供参考，不能替代专业医疗诊断。
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">重要提示</span>
              </div>
              <p className="text-yellow-700 mt-1">
                如果您有以下症状，请立即拨打120或前往急诊科：胸痛、呼吸困难、意识改变、大量出血、严重外伤
              </p>
            </div>
            <Button onClick={() => setCurrentStep(2)} className="w-full">
              开始症状评估
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>症状评估</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSymptomForm()}
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && renderTriageResult()}
    </div>
  );
}