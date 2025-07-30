"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Download, 
  RefreshCw, 
  User, 
  Calendar,
  Activity,
  TestTube,
  Pill,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';
import { PatientRecord } from '@/lib/hospital-integration/types';

interface PatientRecordSyncProps {
  patientId?: string;
}

export function PatientRecordSync({ patientId: initialPatientId }: PatientRecordSyncProps) {
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [patientRecord, setPatientRecord] = useState<PatientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Available hospitals for sync
  const availableHospitals = [
    { id: 'hospital-001', name: '北京协和医院', status: 'connected' },
    { id: 'hospital-002', name: '上海交通大学医学院附属仁济医院', status: 'connected' },
    { id: 'hospital-003', name: '广东省人民医院', status: 'disconnected' },
    { id: 'hospital-004', name: '四川大学华西医院', status: 'connected' }
  ];

  const searchPatient = async () => {
    if (!patientId.trim()) return;

    setIsLoading(true);
    setSyncStatus('syncing');
    setSyncProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);

      const response = await fetch(`/api/hospital/patients/${patientId}`);
      const data = await response.json();

      clearInterval(progressInterval);
      setSyncProgress(100);

      if (data.success) {
        setPatientRecord(data.data);
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleString('zh-CN'));
      } else {
        setSyncStatus('error');
        console.error('Failed to fetch patient:', data.error);
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Error fetching patient:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('idle');
      }, 2000);
    }
  };

  const syncFromMultipleHospitals = async () => {
    if (!patientId.trim()) return;

    const connectedHospitals = availableHospitals
      .filter(h => h.status === 'connected')
      .map(h => h.id);

    setIsLoading(true);
    setSyncStatus('syncing');
    setSyncProgress(0);

    try {
      const response = await fetch(`/api/hospital/patients/${patientId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hospitalIds: connectedHospitals,
          criteria: { patientId }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleString('zh-CN'));
        
        // If we have successful syncs, use the first one for display
        if (data.data.successfulSyncs.length > 0) {
          setPatientRecord(data.data.successfulSyncs[0].data);
        }
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Error syncing from multiple hospitals:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSyncProgress(0);
        setSyncStatus('idle');
      }, 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Patient Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            患者记录同步
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="patientId">患者ID / 医疗记录号</Label>
                <Input
                  id="patientId"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="输入患者ID，例如：MRN001234"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Hospital Status */}
            <div>
              <Label>可用医院系统</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableHospitals.map((hospital) => (
                  <Badge 
                    key={hospital.id} 
                    variant={hospital.status === 'connected' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {hospital.status === 'connected' ? 
                      <CheckCircle className="h-3 w-3" /> : 
                      <XCircle className="h-3 w-3" />
                    }
                    {hospital.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={searchPatient}
                disabled={isLoading || !patientId.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                搜索患者
              </Button>
              <Button 
                variant="outline"
                onClick={syncFromMultipleHospitals}
                disabled={isLoading || !patientId.trim()}
              >
                <Download className="h-4 w-4 mr-2" />
                多院同步
              </Button>
            </div>

            {/* Sync Progress */}
            {syncStatus === 'syncing' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">正在同步患者数据...</span>
                </div>
                <Progress value={syncProgress} className="w-full" />
              </div>
            )}

            {/* Sync Status */}
            {syncStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">数据同步成功</span>
                {lastSyncTime && (
                  <span className="text-xs text-muted-foreground">
                    ({lastSyncTime})
                  </span>
                )}
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">同步失败，请重试</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Record Display */}
      {patientRecord && (
        <Tabs defaultValue="demographics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="demographics" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              基本信息
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              病史
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-1">
              <Pill className="h-4 w-4" />
              用药
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center gap-1">
              <Activity className="h-4 w-4" />
              生命体征
            </TabsTrigger>
            <TabsTrigger value="labs" className="flex items-center gap-1">
              <TestTube className="h-4 w-4" />
              检验结果
            </TabsTrigger>
            <TabsTrigger value="allergies" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              过敏史
            </TabsTrigger>
          </TabsList>

          {/* Demographics */}
          <TabsContent value="demographics">
            <Card>
              <CardHeader>
                <CardTitle>患者基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">姓名</Label>
                    <p className="font-medium">{patientRecord.demographics.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">性别</Label>
                    <p className="font-medium">{patientRecord.demographics.gender}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">出生日期</Label>
                    <p className="font-medium">{formatDate(patientRecord.demographics.dateOfBirth)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">医疗记录号</Label>
                    <p className="font-medium">{patientRecord.medicalRecordNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">电话</Label>
                    <p className="font-medium">{patientRecord.demographics.contact.phone || '未提供'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">邮箱</Label>
                    <p className="font-medium">{patientRecord.demographics.contact.email || '未提供'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-muted-foreground">地址</Label>
                    <p className="font-medium">{patientRecord.demographics.contact.address || '未提供'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical History */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>病史记录</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecord.medicalHistory.map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{entry.diagnosis}</p>
                          <p className="text-sm text-muted-foreground">
                            ICD-10: {entry.icd10Code} | {entry.department}
                          </p>
                          {entry.description && (
                            <p className="text-sm mt-1">{entry.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                            {entry.status === 'active' ? '活动' : 
                             entry.status === 'chronic' ? '慢性' : '已解决'}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle>当前用药</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecord.currentMedications.map((med) => (
                    <div key={med.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{med.name}</p>
                          {med.genericName && (
                            <p className="text-sm text-muted-foreground">
                              通用名: {med.genericName}
                            </p>
                          )}
                          <p className="text-sm">
                            {med.dosage} | {med.frequency} | {med.route}
                          </p>
                          {med.instructions && (
                            <p className="text-sm text-blue-600 mt-1">
                              {med.instructions}
                            </p>
                          )}
                        </div>
                        <Badge variant={med.status === 'active' ? 'default' : 'secondary'}>
                          {med.status === 'active' ? '使用中' : 
                           med.status === 'discontinued' ? '已停药' : '已完成'}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        开始: {formatDate(med.startDate)} | 
                        医生: {med.prescribingPhysician}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vital Signs */}
          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle>生命体征</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecord.vitalSigns.map((vital) => (
                    <div key={vital.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4">
                        {vital.bloodPressure && (
                          <div>
                            <Label className="text-sm text-muted-foreground">血压</Label>
                            <p className="font-medium">
                              {vital.bloodPressure.systolic}/{vital.bloodPressure.diastolic} mmHg
                            </p>
                          </div>
                        )}
                        {vital.heartRate && (
                          <div>
                            <Label className="text-sm text-muted-foreground">心率</Label>
                            <p className="font-medium">{vital.heartRate} bpm</p>
                          </div>
                        )}
                        {vital.temperature && (
                          <div>
                            <Label className="text-sm text-muted-foreground">体温</Label>
                            <p className="font-medium">{vital.temperature} °C</p>
                          </div>
                        )}
                        {vital.oxygenSaturation && (
                          <div>
                            <Label className="text-sm text-muted-foreground">血氧饱和度</Label>
                            <p className="font-medium">{vital.oxygenSaturation}%</p>
                          </div>
                        )}
                        {vital.weight && (
                          <div>
                            <Label className="text-sm text-muted-foreground">体重</Label>
                            <p className="font-medium">{vital.weight} kg</p>
                          </div>
                        )}
                        {vital.height && (
                          <div>
                            <Label className="text-sm text-muted-foreground">身高</Label>
                            <p className="font-medium">{vital.height} cm</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {new Date(vital.timestamp).toLocaleString('zh-CN')} | 
                        记录者: {vital.recordedBy} | 地点: {vital.location}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lab Results */}
          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <CardTitle>检验结果</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecord.labResults.map((lab) => (
                    <div key={lab.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{lab.testName}</p>
                          <p className="text-sm text-muted-foreground">
                            {lab.testCode} | {lab.lab}
                          </p>
                          <div className="mt-2">
                            <span className="text-lg font-semibold">{lab.result}</span>
                            {lab.unit && <span className="text-sm ml-1">{lab.unit}</span>}
                            {lab.referenceRange && (
                              <span className="text-sm text-muted-foreground ml-2">
                                (正常范围: {lab.referenceRange})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {lab.abnormalFlag && (
                            <Badge variant="destructive" className="mb-2">
                              {lab.abnormalFlag === 'high' ? '偏高' : 
                               lab.abnormalFlag === 'low' ? '偏低' : '危急'}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(lab.testDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Allergies */}
          <TabsContent value="allergies">
            <Card>
              <CardHeader>
                <CardTitle>过敏史</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientRecord.allergies.map((allergy) => (
                    <div key={allergy.id} className="border-l-4 border-red-500 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-red-700">{allergy.allergen}</p>
                          <p className="text-sm">反应: {allergy.reaction}</p>
                          {allergy.notes && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {allergy.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            allergy.severity === 'severe' ? 'destructive' : 
                            allergy.severity === 'moderate' ? 'default' : 'secondary'
                          }>
                            {allergy.severity === 'severe' ? '严重' : 
                             allergy.severity === 'moderate' ? '中度' : '轻度'}
                          </Badge>
                          {allergy.onsetDate && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(allergy.onsetDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}