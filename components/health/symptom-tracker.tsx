'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertTriangle, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';

interface SymptomLog {
  id: number;
  userId: number;
  symptomName: string;
  severity: number;
  description: string | null;
  triggers: string | null;
  duration: string | null;
  location: string | null;
  associatedSymptoms: string | null;
  loggedAt: Date;
  createdAt: Date;
}

interface SymptomTrackerProps {
  userId: number;
}

interface SymptomFormData {
  symptomName: string;
  severity: string;
  description: string;
  triggers: string;
  duration: string;
  location: string;
  associatedSymptoms: string;
  loggedAt: string;
}

const commonSymptoms = [
  '疲劳',
  '恶心',
  '呕吐',
  '疼痛',
  '发热',
  '头痛',
  '食欲不振',
  '失眠',
  '焦虑',
  '便秘',
  '腹泻',
  '呼吸困难',
  '咳嗽',
  '皮疹',
  '麻木',
  '其他',
];

const severityLevels = [
  { value: '1', label: '轻微 (1)', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: '2', label: '轻度 (2)', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: '3', label: '轻度 (3)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: '4', label: '中度 (4)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: '5', label: '中度 (5)', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: '6', label: '较重 (6)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: '7', label: '较重 (7)', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: '8', label: '严重 (8)', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: '9', label: '严重 (9)', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: '10', label: '极严重 (10)', color: 'bg-red-100 text-red-800 border-red-200' },
];

export function SymptomTracker({ userId }: SymptomTrackerProps) {
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<SymptomFormData>({
    defaultValues: {
      loggedAt: new Date().toISOString().split('T')[0],
    }
  });

  // Load symptom logs
  const loadSymptoms = async () => {
    try {
      const response = await fetch('/api/symptoms');
      const data = await response.json();
      if (data.success) {
        setSymptoms(data.symptoms);
      }
    } catch (error) {
      console.error('Error loading symptoms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add symptom log
  const handleAddSymptom = async (data: SymptomFormData) => {
    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          severity: parseInt(data.severity),
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadSymptoms();
        setShowAddForm(false);
        reset({
          loggedAt: new Date().toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error adding symptom:', error);
    }
  };

  useEffect(() => {
    loadSymptoms();
  }, []);

  const getSeverityInfo = (severity: number) => {
    const level = severityLevels.find(l => parseInt(l.value) === severity);
    return level || severityLevels[0];
  };

  const getSymptomStats = () => {
    const last30Days = symptoms.filter(s => 
      new Date(s.loggedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    );

    const avgSeverity = last30Days.length > 0 
      ? (last30Days.reduce((sum, s) => sum + s.severity, 0) / last30Days.length).toFixed(1)
      : '0';

    const mostCommon = last30Days.reduce((acc, s) => {
      acc[s.symptomName] = (acc[s.symptomName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSymptom = Object.keys(mostCommon).length > 0
      ? Object.entries(mostCommon).sort(([,a], [,b]) => b - a)[0][0]
      : '无';

    return {
      totalLogs: last30Days.length,
      avgSeverity,
      topSymptom,
    };
  };

  const stats = getSymptomStats();

  const renderSymptomCard = (symptom: SymptomLog) => {
    const severityInfo = getSeverityInfo(symptom.severity);
    return (
      <Card key={symptom.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{symptom.symptomName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={severityInfo.color}>
                  严重程度: {symptom.severity}/10
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(symptom.loggedAt).toLocaleDateString('zh-CN')} 
                  {' '}
                  {new Date(symptom.loggedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {symptom.description && (
              <div>
                <span className="font-medium text-sm">描述:</span>
                <p className="text-gray-700 mt-1">{symptom.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {symptom.duration && (
                <div>
                  <span className="font-medium">持续时间:</span>
                  <span className="ml-2 text-gray-600">{symptom.duration}</span>
                </div>
              )}
              {symptom.location && (
                <div>
                  <span className="font-medium">部位:</span>
                  <span className="ml-2 text-gray-600">{symptom.location}</span>
                </div>
              )}
              {symptom.triggers && (
                <div className="col-span-full">
                  <span className="font-medium">诱因:</span>
                  <span className="ml-2 text-gray-600">{symptom.triggers}</span>
                </div>
              )}
              {symptom.associatedSymptoms && (
                <div className="col-span-full">
                  <span className="font-medium">伴随症状:</span>
                  <span className="ml-2 text-gray-600">{symptom.associatedSymptoms}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAddSymptomForm = () => (
    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          记录症状
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>记录症状</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleAddSymptom)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="symptomName">症状名称 *</Label>
              <Select onValueChange={(value) => setValue('symptomName', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择症状" />
                </SelectTrigger>
                <SelectContent>
                  {commonSymptoms.map((symptom) => (
                    <SelectItem key={symptom} value={symptom}>
                      {symptom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!watch('symptomName') && (
                <Input
                  className="mt-2"
                  {...register('symptomName', { required: '请选择或输入症状名称' })}
                  placeholder="或输入其他症状"
                />
              )}
              {errors.symptomName && (
                <p className="text-sm text-red-600 mt-1">{errors.symptomName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="severity">严重程度 (1-10) *</Label>
              <Select onValueChange={(value) => setValue('severity', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择严重程度" />
                </SelectTrigger>
                <SelectContent>
                  {severityLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-sm text-red-600 mt-1">请选择严重程度</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="loggedAt">记录时间 *</Label>
            <Input
              id="loggedAt"
              type="datetime-local"
              {...register('loggedAt', { required: '请选择记录时间' })}
            />
            {errors.loggedAt && (
              <p className="text-sm text-red-600 mt-1">{errors.loggedAt.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">详细描述</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="描述症状的具体情况、感受等"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">持续时间</Label>
              <Input
                id="duration"
                {...register('duration')}
                placeholder="例：2小时、持续性等"
              />
            </div>
            <div>
              <Label htmlFor="location">症状部位</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="例：头部、腹部等"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="triggers">可能诱因</Label>
            <Textarea
              id="triggers"
              {...register('triggers')}
              placeholder="可能引起症状的因素，如活动、食物、情绪等"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="associatedSymptoms">伴随症状</Label>
            <Textarea
              id="associatedSymptoms"
              {...register('associatedSymptoms')}
              placeholder="同时出现的其他症状"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button type="submit">
              记录症状
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">症状追踪</h2>
        {renderAddSymptomForm()}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{stats.totalLogs}</p>
                <p className="text-sm text-gray-600">近30天记录</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-gray-600" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{stats.avgSeverity}</p>
                <p className="text-sm text-gray-600">平均严重程度</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
              <div className="ml-2">
                <p className="text-lg font-bold truncate">{stats.topSymptom}</p>
                <p className="text-sm text-gray-600">最常见症状</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Symptoms List */}
      {symptoms.length > 0 ? (
        <div className="space-y-4">
          {symptoms.slice(0, 20).map(renderSymptomCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">还没有记录任何症状</p>
            <p className="text-sm text-gray-400 mt-2">开始记录症状来跟踪您的健康状况</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}