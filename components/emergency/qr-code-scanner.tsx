'use client';

import { useState } from 'react';
import { QrCode, Search, AlertTriangle, Heart, Phone, User, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EmergencyInfo {
  cardId: string;
  patientInfo: {
    patientName: string;
    age: number;
    cancerType?: string;
    treatmentPhase?: string;
    currentTreatments?: string[];
    criticalNotes?: string;
  };
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean;
  }>;
  allergies?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  medicalConditions?: string[];
  bloodType?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  lastUpdated: string;
}

export function QRCodeScanner() {
  const [cardId, setCardId] = useState('');
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const scanCard = async () => {
    if (!cardId.trim()) {
      setError('请输入卡号');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/emergency-cards/scan?cardId=${cardId}`);
      
      if (response.ok) {
        const data = await response.json();
        setEmergencyInfo(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '未找到急救卡信息');
      }
    } catch (error) {
      console.error('Error scanning card:', error);
      setError('扫描失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardId(e.target.value.toUpperCase());
    setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      scanCard();
    }
  };

  const callEmergencyContact = (phone: string, name: string) => {
    window.location.href = `tel:${phone}`;
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            急救卡扫描系统
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>仅供医护人员使用</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cardId">请输入急救卡号或扫描二维码</Label>
              <div className="flex gap-2">
                <Input
                  id="cardId"
                  value={cardId}
                  onChange={handleCardIdChange}
                  onKeyPress={handleKeyPress}
                  placeholder="输入16位卡号 (如: ABCD1234EFGH5678)"
                  className="font-mono text-center"
                  maxLength={16}
                />
                <Button 
                  onClick={scanCard} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      扫描中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      扫描
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {emergencyInfo && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              急救医疗信息
            </CardTitle>
            <div className="text-sm text-green-600">
              <Clock className="h-4 w-4 inline mr-1" />
              最后更新: {formatLastUpdated(emergencyInfo.lastUpdated)}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="patient" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="patient">患者信息</TabsTrigger>
                <TabsTrigger value="contacts">紧急联系人</TabsTrigger>
                <TabsTrigger value="medical">医疗信息</TabsTrigger>
                <TabsTrigger value="insurance">保险信息</TabsTrigger>
              </TabsList>

              <TabsContent value="patient">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong className="text-gray-700">患者姓名:</strong>
                      <div className="text-lg font-semibold">{emergencyInfo.patientInfo.patientName}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">年龄:</strong>
                      <div className="text-lg">{emergencyInfo.patientInfo.age} 岁</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">血型:</strong>
                      <div className="text-lg font-semibold text-red-600">{emergencyInfo.bloodType || '未知'}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">癌症类型:</strong>
                      <div className="text-lg">{emergencyInfo.patientInfo.cancerType || '未提供'}</div>
                    </div>
                  </div>

                  <div>
                    <strong className="text-gray-700">治疗阶段:</strong>
                    <div className="mt-1">{emergencyInfo.patientInfo.treatmentPhase || '未提供'}</div>
                  </div>

                  {emergencyInfo.patientInfo.currentTreatments && emergencyInfo.patientInfo.currentTreatments.length > 0 && (
                    <div>
                      <strong className="text-gray-700">当前治疗方案:</strong>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {emergencyInfo.patientInfo.currentTreatments.map((treatment, index) => (
                          <Badge key={index} variant="secondary">{treatment}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {emergencyInfo.patientInfo.criticalNotes && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <strong className="text-red-700">⚠️ 重要医疗备注:</strong>
                      <div className="mt-2 text-red-800">{emergencyInfo.patientInfo.criticalNotes}</div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contacts">
                <div className="space-y-4">
                  {emergencyInfo.emergencyContacts.map((contact, index) => (
                    <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {contact.name}
                          {contact.isPrimary && (
                            <Badge className="bg-blue-100 text-blue-800">主要联系人</Badge>
                          )}
                        </div>
                        <div className="text-gray-600">{contact.relationship}</div>
                        <div className="text-lg font-mono">{contact.phone}</div>
                      </div>
                      <Button 
                        onClick={() => callEmergencyContact(contact.phone, contact.name)}
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        呼叫
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="medical">
                <div className="space-y-6">
                  {/* Allergies */}
                  {emergencyInfo.allergies && emergencyInfo.allergies.length > 0 && (
                    <div>
                      <strong className="text-red-700">⚠️ 过敏信息:</strong>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {emergencyInfo.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="text-sm">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Medications */}
                  {emergencyInfo.medications && emergencyInfo.medications.length > 0 && (
                    <div>
                      <strong className="text-gray-700">当前用药:</strong>
                      <div className="mt-2 space-y-2">
                        {emergencyInfo.medications.map((medication, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg">
                            <div className="font-semibold">{medication.name}</div>
                            <div className="text-sm text-gray-600">
                              剂量: {medication.dosage} | 频率: {medication.frequency}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Conditions */}
                  {emergencyInfo.medicalConditions && emergencyInfo.medicalConditions.length > 0 && (
                    <div>
                      <strong className="text-gray-700">既往病史:</strong>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {emergencyInfo.medicalConditions.map((condition, index) => (
                          <Badge key={index} variant="outline" className="text-sm">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insurance">
                {emergencyInfo.insuranceInfo ? (
                  <div className="space-y-4">
                    <div>
                      <strong className="text-gray-700">保险公司:</strong>
                      <div className="text-lg">{emergencyInfo.insuranceInfo.provider}</div>
                    </div>
                    <div>
                      <strong className="text-gray-700">保单号:</strong>
                      <div className="font-mono text-lg">{emergencyInfo.insuranceInfo.policyNumber}</div>
                    </div>
                    {emergencyInfo.insuranceInfo.groupNumber && (
                      <div>
                        <strong className="text-gray-700">团体号:</strong>
                        <div className="font-mono">{emergencyInfo.insuranceInfo.groupNumber}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-500">未提供保险信息</div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}