'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Clock, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Medication, NewMedication, MedicationReminder, MedicationLog, MedicationStatus } from '@/lib/db/schema';

interface MedicationManagerProps {
  userId: number;
}

interface MedicationFormData {
  medicationName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  routeOfAdministration: string;
  startDate: string;
  endDate: string;
  prescribedBy: string;
  indication: string;
  instructions: string;
}

interface ReminderFormData {
  reminderTime: string;
  daysOfWeek: number[];
}

export function MedicationManager({ userId }: MedicationManagerProps) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MedicationFormData>();
  const { register: registerReminder, handleSubmit: handleReminderSubmit, reset: resetReminder } = useForm<ReminderFormData>();

  // Load medications
  const loadMedications = async () => {
    try {
      const response = await fetch('/api/medications');
      const data = await response.json();
      if (data.success) {
        setMedications(data.medications);
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load medication logs
  const loadMedicationLogs = async () => {
    try {
      const response = await fetch('/api/medications/logs');
      const data = await response.json();
      if (data.success) {
        setMedicationLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading medication logs:', error);
    }
  };

  // Add medication
  const handleAddMedication = async (data: MedicationFormData) => {
    try {
      const response = await fetch('/api/medications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        await loadMedications();
        setShowAddForm(false);
        reset();
      }
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  // Log medication taken
  const handleLogMedication = async (medicationId: number, status: MedicationStatus) => {
    try {
      const response = await fetch('/api/medications/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationId,
          status,
          takenAt: new Date().toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadMedicationLogs();
      }
    } catch (error) {
      console.error('Error logging medication:', error);
    }
  };

  useEffect(() => {
    loadMedications();
    loadMedicationLogs();
  }, []);

  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case MedicationStatus.TAKEN:
        return 'bg-green-100 text-green-800 border-green-200';
      case MedicationStatus.MISSED:
        return 'bg-red-100 text-red-800 border-red-200';
      case MedicationStatus.SKIPPED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderMedicationCard = (medication: Medication) => (
    <Card key={medication.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{medication.medicationName}</CardTitle>
            {medication.genericName && (
              <p className="text-sm text-gray-600 mt-1">通用名: {medication.genericName}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={medication.isActive ? 'default' : 'secondary'}>
              {medication.isActive ? '使用中' : '已停用'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMedication(medication)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">剂量:</span> {medication.dosage}
          </div>
          <div>
            <span className="font-medium">频率:</span> {medication.frequency}
          </div>
          <div>
            <span className="font-medium">开始日期:</span> {medication.startDate ? new Date(medication.startDate).toLocaleDateString('zh-CN') : '-'}
          </div>
          <div>
            <span className="font-medium">医生:</span> {medication.prescribedBy || '-'}
          </div>
        </div>
        
        {medication.indication && (
          <div className="mt-3">
            <span className="font-medium text-sm">适应症:</span>
            <p className="text-sm text-gray-600 mt-1">{medication.indication}</p>
          </div>
        )}
        
        {medication.instructions && (
          <div className="mt-3">
            <span className="font-medium text-sm">用药说明:</span>
            <p className="text-sm text-gray-600 mt-1">{medication.instructions}</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleLogMedication(medication.id, MedicationStatus.TAKEN)}
          >
            <Check className="h-4 w-4 mr-1" />
            已服用
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleLogMedication(medication.id, MedicationStatus.MISSED)}
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            遗漏
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddMedicationForm = () => (
    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          添加药物
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>添加新药物</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleAddMedication)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medicationName">药物名称 *</Label>
              <Input
                id="medicationName"
                {...register('medicationName', { required: '请输入药物名称' })}
                placeholder="例：阿司匹林"
              />
              {errors.medicationName && (
                <p className="text-sm text-red-600 mt-1">{errors.medicationName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="genericName">通用名</Label>
              <Input
                id="genericName"
                {...register('genericName')}
                placeholder="例：乙酰水杨酸"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dosage">剂量 *</Label>
              <Input
                id="dosage"
                {...register('dosage', { required: '请输入剂量' })}
                placeholder="例：100mg"
              />
              {errors.dosage && (
                <p className="text-sm text-red-600 mt-1">{errors.dosage.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="frequency">频率 *</Label>
              <Input
                id="frequency"
                {...register('frequency', { required: '请输入用药频率' })}
                placeholder="例：每日一次"
              />
              {errors.frequency && (
                <p className="text-sm text-red-600 mt-1">{errors.frequency.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="routeOfAdministration">用药途径</Label>
              <Select onValueChange={(value) => register('routeOfAdministration').onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择用药途径" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">口服</SelectItem>
                  <SelectItem value="injection">注射</SelectItem>
                  <SelectItem value="topical">外用</SelectItem>
                  <SelectItem value="inhaled">吸入</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prescribedBy">开药医生</Label>
              <Input
                id="prescribedBy"
                {...register('prescribedBy')}
                placeholder="医生姓名"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">开始日期 *</Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate', { required: '请选择开始日期' })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="indication">适应症</Label>
            <Textarea
              id="indication"
              {...register('indication')}
              placeholder="用药原因和适应症"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="instructions">用药说明</Label>
            <Textarea
              id="instructions"
              {...register('instructions')}
              placeholder="特殊用药说明和注意事项"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button type="submit">
              添加药物
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
        <h2 className="text-2xl font-bold">药物管理</h2>
        {renderAddMedicationForm()}
      </div>

      <Tabs defaultValue="medications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medications">当前药物</TabsTrigger>
          <TabsTrigger value="logs">用药记录</TabsTrigger>
          <TabsTrigger value="reminders">提醒设置</TabsTrigger>
        </TabsList>

        <TabsContent value="medications">
          {medications.length > 0 ? (
            <div className="space-y-4">
              {medications.map(renderMedicationCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">还没有添加任何药物</p>
                <p className="text-sm text-gray-400 mt-2">点击"添加药物"开始管理您的用药</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>用药记录</CardTitle>
            </CardHeader>
            <CardContent>
              {medicationLogs.length > 0 ? (
                <div className="space-y-2">
                  {medicationLogs.slice(0, 20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{log.medicationId}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(log.takenAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <Badge className={getStatusColor(log.status as MedicationStatus)}>
                        {log.status === MedicationStatus.TAKEN ? '已服用' : 
                         log.status === MedicationStatus.MISSED ? '遗漏' : '跳过'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">还没有用药记录</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>提醒设置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">提醒功能正在开发中</p>
                <p className="text-sm text-gray-400 mt-2">敬请期待智能用药提醒功能</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}