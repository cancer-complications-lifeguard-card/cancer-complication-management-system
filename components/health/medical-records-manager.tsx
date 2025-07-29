'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, User, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';

interface MedicalRecord {
  id: number;
  userId: number;
  recordType: string;
  title: string;
  description: string;
  recordDate: Date;
  hospital: string | null;
  doctor: string | null;
  diagnosis: string | null;
  treatment: string | null;
  followUpDate: Date | null;
  attachments: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MedicalRecordsManagerProps {
  userId: number;
}

interface RecordFormData {
  recordType: string;
  title: string;
  description: string;
  recordDate: string;
  hospital: string;
  doctor: string;
  diagnosis: string;
  treatment: string;
  followUpDate: string;
}

const recordTypes = [
  { value: 'consultation', label: '门诊记录' },
  { value: 'hospitalization', label: '住院记录' },
  { value: 'surgery', label: '手术记录' },
  { value: 'test_result', label: '检查结果' },
  { value: 'lab_report', label: '化验报告' },
  { value: 'imaging', label: '影像学检查' },
  { value: 'pathology', label: '病理报告' },
  { value: 'treatment', label: '治疗记录' },
  { value: 'other', label: '其他' },
];

export function MedicalRecordsManager({ userId }: MedicalRecordsManagerProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<RecordFormData>();

  // Load medical records
  const loadRecords = async () => {
    try {
      const response = await fetch('/api/medical-records');
      const data = await response.json();
      if (data.success) {
        setRecords(data.records);
      }
    } catch (error) {
      console.error('Error loading medical records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add medical record
  const handleAddRecord = async (data: RecordFormData) => {
    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        await loadRecords();
        setShowAddForm(false);
        reset();
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const getRecordTypeLabel = (type: string) => {
    const recordType = recordTypes.find(rt => rt.value === type);
    return recordType ? recordType.label : type;
  };

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      consultation: 'bg-blue-100 text-blue-800 border-blue-200',
      hospitalization: 'bg-red-100 text-red-800 border-red-200',
      surgery: 'bg-purple-100 text-purple-800 border-purple-200',
      test_result: 'bg-green-100 text-green-800 border-green-200',
      lab_report: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      imaging: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      pathology: 'bg-pink-100 text-pink-800 border-pink-200',
      treatment: 'bg-teal-100 text-teal-800 border-teal-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[type] || colors.other;
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (record.doctor && record.doctor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (record.hospital && record.hospital.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || record.recordType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const renderRecordCard = (record: MedicalRecord) => (
    <Card key={record.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getRecordTypeColor(record.recordType)}>
                {getRecordTypeLabel(record.recordType)}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(record.recordDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <CardTitle className="text-lg">{record.title}</CardTitle>
          </div>
          <FileText className="h-5 w-5 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-gray-700">{record.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {record.hospital && (
              <div>
                <span className="font-medium">医院:</span>
                <span className="ml-2 text-gray-600">{record.hospital}</span>
              </div>
            )}
            {record.doctor && (
              <div>
                <span className="font-medium">医生:</span>
                <span className="ml-2 text-gray-600">{record.doctor}</span>
              </div>
            )}
            {record.diagnosis && (
              <div className="col-span-full">
                <span className="font-medium">诊断:</span>
                <span className="ml-2 text-gray-600">{record.diagnosis}</span>
              </div>
            )}
            {record.treatment && (
              <div className="col-span-full">
                <span className="font-medium">治疗:</span>
                <span className="ml-2 text-gray-600">{record.treatment}</span>
              </div>
            )}
            {record.followUpDate && (
              <div>
                <span className="font-medium">复查时间:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(record.followUpDate).toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddRecordForm = () => (
    <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="h-4 w-4 mr-2" />
          添加病历记录
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加病历记录</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleAddRecord)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recordType">记录类型 *</Label>
              <Select onValueChange={(value) => register('recordType').onChange({ target: { value } })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择记录类型" />
                </SelectTrigger>
                <SelectContent>
                  {recordTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="recordDate">记录日期 *</Label>
              <Input
                id="recordDate"
                type="date"
                {...register('recordDate', { required: '请选择记录日期' })}
              />
              {errors.recordDate && (
                <p className="text-sm text-red-600 mt-1">{errors.recordDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              {...register('title', { required: '请输入标题' })}
              placeholder="例：例行复查"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">描述 *</Label>
            <Textarea
              id="description"
              {...register('description', { required: '请输入描述' })}
              placeholder="详细描述病情、症状或检查结果"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hospital">医院</Label>
              <Input
                id="hospital"
                {...register('hospital')}
                placeholder="例：中山大学肿瘤防治中心"
              />
            </div>
            <div>
              <Label htmlFor="doctor">医生</Label>
              <Input
                id="doctor"
                {...register('doctor')}
                placeholder="主治医生姓名"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="diagnosis">诊断结果</Label>
            <Textarea
              id="diagnosis"
              {...register('diagnosis')}
              placeholder="医生的诊断结果"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="treatment">治疗方案</Label>
            <Textarea
              id="treatment"
              {...register('treatment')}
              placeholder="制定的治疗方案或用药方案"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="followUpDate">复查日期</Label>
            <Input
              id="followUpDate"
              type="date"
              {...register('followUpDate')}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              取消
            </Button>
            <Button type="submit">
              添加记录
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
        <h2 className="text-2xl font-bold">病历档案</h2>
        {renderAddRecordForm()}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索病历记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="筛选类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有类型</SelectItem>
            {recordTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records List */}
      {filteredRecords.length > 0 ? (
        <div className="space-y-4">
          {filteredRecords.map(renderRecordCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' ? '没有找到匹配的记录' : '还没有添加病历记录'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {searchTerm || filterType !== 'all' ? '尝试调整搜索条件' : '点击"添加病历记录"开始管理您的病历档案'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}