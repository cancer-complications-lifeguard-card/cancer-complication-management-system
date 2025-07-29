'use client';

import { useState, useEffect } from 'react';
import { CreditCard, QrCode, Phone, Edit, Save, X, UserPlus, Heart, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

interface MedicalInfo {
  patientName: string;
  age: number;
  cancerType?: string;
  treatmentPhase?: string;
  currentTreatments?: string[];
  criticalNotes?: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
}

interface EmergencyCard {
  id: number;
  cardId: string;
  qrCode: string;
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
  allergies?: string[];
  medications?: Medication[];
  medicalConditions?: string[];
  bloodType?: string;
  insuranceInfo?: InsuranceInfo;
  lastUpdated: string;
  createdAt: string;
}

interface EmergencyCardManagerProps {
  userId: number;
}

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const relationshipTypes = ['配偶', '父母', '子女', '兄弟姐妹', '朋友', '监护人', '医疗代理人', '其他'];
const cancerTypes = ['乳腺癌', '肺癌', '胃癌', '肝癌', '结直肠癌', '白血病', '淋巴瘤', '其他'];
const treatmentPhases = ['确诊期', '治疗期', '康复期', '随访期', '维持治疗'];

export function EmergencyCardManager({ userId }: EmergencyCardManagerProps) {
  const [card, setCard] = useState<EmergencyCard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<EmergencyCard>>({});
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    fetchEmergencyCard();
  }, [userId]);

  const fetchEmergencyCard = async () => {
    try {
      const response = await fetch('/api/emergency-cards');
      if (response.ok) {
        const data = await response.json();
        setCard(data);
        setFormData(data || {});
      }
    } catch (error) {
      console.error('Error fetching emergency card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const url = card ? '/api/emergency-cards' : '/api/emergency-cards';
      const method = card ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchEmergencyCard();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving emergency card:', error);
    }
  };

  const handleCancel = () => {
    setFormData(card || {});
    setIsEditing(false);
  };

  const addEmergencyContact = () => {
    const newContact: EmergencyContact = {
      name: '',
      relationship: '',
      phone: '',
    };
    setFormData({
      ...formData,
      emergencyContacts: [...(formData.emergencyContacts || []), newContact],
    });
  };

  const removeEmergencyContact = (index: number) => {
    const updatedContacts = formData.emergencyContacts?.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    });
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: any) => {
    const updatedContacts = formData.emergencyContacts?.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    });
  };

  const addMedication = () => {
    const newMedication: Medication = {
      name: '',
      dosage: '',
      frequency: '',
    };
    setFormData({
      ...formData,
      medications: [...(formData.medications || []), newMedication],
    });
  };

  const removeMedication = (index: number) => {
    const updatedMedications = formData.medications?.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      medications: updatedMedications,
    });
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updatedMedications = formData.medications?.map((medication, i) => 
      i === index ? { ...medication, [field]: value } : medication
    );
    setFormData({
      ...formData,
      medications: updatedMedications,
    });
  };

  const addAllergy = () => {
    const allergy = prompt('请输入过敏原名称：');
    if (allergy) {
      setFormData({
        ...formData,
        allergies: [...(formData.allergies || []), allergy],
      });
    }
  };

  const removeAllergy = (index: number) => {
    const updatedAllergies = formData.allergies?.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      allergies: updatedAllergies,
    });
  };

  const addMedicalCondition = () => {
    const condition = prompt('请输入疾病名称：');
    if (condition) {
      setFormData({
        ...formData,
        medicalConditions: [...(formData.medicalConditions || []), condition],
      });
    }
  };

  const removeMedicalCondition = (index: number) => {
    const updatedConditions = formData.medicalConditions?.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      medicalConditions: updatedConditions,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">急救小红卡</h2>
        </div>
        <div className="flex gap-2">
          {card && (
            <Button 
              variant="outline" 
              onClick={() => setShowQRCode(true)}
              className="flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              查看二维码
            </Button>
          )}
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              {card ? '编辑' : '创建'}
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                保存
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                取消
              </Button>
            </div>
          )}
        </div>
      </div>

      {!card && !isEditing ? (
        <Card className="border-red-200">
          <CardContent className="text-center py-12">
            <CreditCard className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">还没有急救卡</h3>
            <p className="text-gray-500 mb-4">创建您的急救卡，在紧急情况下为医护人员提供重要信息</p>
            <Button onClick={() => setIsEditing(true)} className="bg-red-600 hover:bg-red-700">
              创建急救卡
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="contacts">紧急联系人</TabsTrigger>
            <TabsTrigger value="medical">医疗信息</TabsTrigger>
            <TabsTrigger value="preview">预览</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">姓名</Label>
                    <Input
                      id="patientName"
                      value={formData.medicalInfo?.patientName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        medicalInfo: { ...formData.medicalInfo, patientName: e.target.value }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">年龄</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.medicalInfo?.age || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        medicalInfo: { ...formData.medicalInfo, age: parseInt(e.target.value) }
                      })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bloodType">血型</Label>
                    <Select 
                      value={formData.bloodType || ''} 
                      onValueChange={(value) => setFormData({ ...formData, bloodType: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择血型" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cancerType">癌症类型</Label>
                    <Select 
                      value={formData.medicalInfo?.cancerType || ''} 
                      onValueChange={(value) => setFormData({
                        ...formData,
                        medicalInfo: { ...formData.medicalInfo, cancerType: value }
                      })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择癌症类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {cancerTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="treatmentPhase">治疗阶段</Label>
                  <Select 
                    value={formData.medicalInfo?.treatmentPhase || ''} 
                    onValueChange={(value) => setFormData({
                      ...formData,
                      medicalInfo: { ...formData.medicalInfo, treatmentPhase: value }
                    })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择治疗阶段" />
                    </SelectTrigger>
                    <SelectContent>
                      {treatmentPhases.map(phase => (
                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="criticalNotes">重要备注</Label>
                  <Textarea
                    id="criticalNotes"
                    placeholder="请输入医护人员需要立即了解的重要信息..."
                    value={formData.medicalInfo?.criticalNotes || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      medicalInfo: { ...formData.medicalInfo, criticalNotes: e.target.value }
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>紧急联系人</CardTitle>
                  {isEditing && (
                    <Button onClick={addEmergencyContact} size="sm" className="flex items-center gap-1">
                      <UserPlus className="h-4 w-4" />
                      添加联系人
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.emergencyContacts?.map((contact, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>姓名</Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div>
                        <Label>关系</Label>
                        <Select 
                          value={contact.relationship} 
                          onValueChange={(value) => updateEmergencyContact(index, 'relationship', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择关系" />
                          </SelectTrigger>
                          <SelectContent>
                            {relationshipTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>电话</Label>
                        <Input
                          value={contact.phone}
                          onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateEmergencyContact(index, 'isPrimary', !contact.isPrimary)}
                          disabled={!isEditing}
                        >
                          {contact.isPrimary ? '主要' : '次要'}
                        </Button>
                        {isEditing && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeEmergencyContact(index)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medical">
            <div className="space-y-6">
              {/* Allergies */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>过敏信息</CardTitle>
                    {isEditing && (
                      <Button onClick={addAllergy} size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        添加过敏原
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies?.map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center gap-1">
                        {allergy}
                        {isEditing && (
                          <button onClick={() => removeAllergy(index)} className="ml-1 text-red-200 hover:text-white">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>当前用药</CardTitle>
                    {isEditing && (
                      <Button onClick={addMedication} size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        添加药物
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.medications?.map((medication, index) => (
                      <div key={index} className="grid grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div>
                          <Label>药物名称</Label>
                          <Input
                            value={medication.name}
                            onChange={(e) => updateMedication(index, 'name', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>剂量</Label>
                          <Input
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <Label>频率</Label>
                          <Input
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="flex items-end">
                          {isEditing && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMedication(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Conditions */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>既往病史</CardTitle>
                    {isEditing && (
                      <Button onClick={addMedicalCondition} size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        添加疾病
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {formData.medicalConditions?.map((condition, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {condition}
                        {isEditing && (
                          <button onClick={() => removeMedicalCondition(index)} className="ml-1 text-gray-400 hover:text-gray-600">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  急救医疗信息卡
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>姓名:</strong> {formData.medicalInfo?.patientName}
                  </div>
                  <div>
                    <strong>年龄:</strong> {formData.medicalInfo?.age}
                  </div>
                  <div>
                    <strong>血型:</strong> {formData.bloodType}
                  </div>
                  <div>
                    <strong>癌症类型:</strong> {formData.medicalInfo?.cancerType}
                  </div>
                </div>
                
                {formData.emergencyContacts && formData.emergencyContacts.length > 0 && (
                  <div>
                    <strong>紧急联系人:</strong>
                    {formData.emergencyContacts.map((contact, index) => (
                      <div key={index} className="ml-4 mt-1">
                        {contact.name} ({contact.relationship}) - {contact.phone}
                        {contact.isPrimary && <Badge className="ml-2">主要</Badge>}
                      </div>
                    ))}
                  </div>
                )}

                {formData.allergies && formData.allergies.length > 0 && (
                  <div>
                    <strong>过敏信息:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive">{allergy}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.medications && formData.medications.length > 0 && (
                  <div>
                    <strong>当前用药:</strong>
                    {formData.medications.map((medication, index) => (
                      <div key={index} className="ml-4 mt-1">
                        {medication.name} - {medication.dosage} ({medication.frequency})
                      </div>
                    ))}
                  </div>
                )}

                {formData.medicalInfo?.criticalNotes && (
                  <div>
                    <strong>重要备注:</strong>
                    <div className="ml-4 mt-1 p-2 bg-red-50 rounded">
                      {formData.medicalInfo.criticalNotes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* QR Code Dialog */}
      {card && (
        <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>急救卡二维码</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img 
                  src={card.qrCode} 
                  alt="Emergency Card QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-gray-600">
                卡号: {card.cardId}
              </p>
              <p className="text-xs text-gray-500">
                医护人员可扫描此二维码获取您的紧急医疗信息
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}