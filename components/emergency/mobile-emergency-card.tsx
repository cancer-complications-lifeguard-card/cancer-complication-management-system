'use client';

import { useState } from 'react';
import { 
  Phone, 
  QrCode, 
  User, 
  Heart, 
  AlertTriangle,
  MapPin,
  Clock,
  CreditCard,
  Copy,
  Share2,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MobileDashboardLayout, MobileStatsCard, MobileActionCard } from '@/components/layout/mobile-dashboard-layout';

interface EmergencyCardData {
  cardId: string;
  patientName: string;
  age: number;
  bloodType: string;
  cancerType: string;
  treatmentPhase: string;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  allergies: string[];
  medicalConditions: string[];
  qrCodeUrl: string;
}

interface MobileEmergencyCardProps {
  cardData?: EmergencyCardData;
  onCreateCard?: () => void;
  onUpdateCard?: (data: Partial<EmergencyCardData>) => void;
}

export function MobileEmergencyCard({ 
  cardData, 
  onCreateCard,
  onUpdateCard 
}: MobileEmergencyCardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCardId = async () => {
    if (cardData?.cardId) {
      await navigator.clipboard.writeText(cardData.cardId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleEmergencyCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleShareCard = async () => {
    if (navigator.share && cardData) {
      try {
        await navigator.share({
          title: '急救医疗信息卡',
          text: `${cardData.patientName}的急救医疗信息`,
          url: window.location.href
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    }
  };

  if (!cardData) {
    return (
      <MobileDashboardLayout
        title="急救小红卡"
        subtitle="创建您的紧急医疗信息卡"
      >
        <MobileActionCard
          title="创建急救卡"
          description="为紧急情况准备重要的医疗信息，包括紧急联系人、药物信息和过敏史"
          icon={<CreditCard className="h-5 w-5 text-primary" />}
          action={
            <Button onClick={onCreateCard} className="w-full sm:w-auto">
              <CreditCard className="h-4 w-4 mr-2" />
              立即创建
            </Button>
          }
        />
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            急救卡包含您的关键医疗信息，请确保信息准确完整。紧急情况下，医护人员可通过扫描二维码快速获取您的信息。
          </AlertDescription>
        </Alert>
      </MobileDashboardLayout>
    );
  }

  return (
    <MobileDashboardLayout
      title="急救小红卡"
      subtitle={`卡号: ${cardData.cardId}`}
      headerAction={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShareCard}>
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">分享</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyCardId}>
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">
              {isCopied ? '已复制' : '复制'}
            </span>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MobileStatsCard
          title="急救联系人"
          value={cardData.emergencyContacts.length}
          icon={<Phone className="h-5 w-5 text-primary" />}
        />
        <MobileStatsCard
          title="用药信息"
          value={cardData.medications.length}
          icon={<Heart className="h-5 w-5 text-primary" />}
        />
        <MobileStatsCard
          title="过敏信息"
          value={cardData.allergies.length}
          icon={<AlertTriangle className="h-5 w-5 text-primary" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            概览
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs sm:text-sm">
            联系人
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-xs sm:text-sm">
            医疗
          </TabsTrigger>
          <TabsTrigger value="qr" className="text-xs sm:text-sm">
            二维码
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                患者信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    姓名
                  </label>
                  <p className="text-base font-medium">{cardData.patientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    年龄
                  </label>
                  <p className="text-base font-medium">{cardData.age} 岁</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    血型
                  </label>
                  <p className="text-base font-medium">{cardData.bloodType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    癌症类型
                  </label>
                  <p className="text-base font-medium">{cardData.cancerType}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  治疗阶段
                </label>
                <Badge variant="outline" className="mt-1">
                  {cardData.treatmentPhase}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                紧急呼叫
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={() => handleEmergencyCall('120')}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  呼叫 120
                </Button>
                {cardData.emergencyContacts
                  .filter(contact => contact.isPrimary)
                  .slice(0, 1)
                  .map((contact, index) => (
                    <Button
                      key={index}
                      onClick={() => handleEmergencyCall(contact.phone)}
                      variant="outline"
                      className="w-full"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {contact.name}
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          {cardData.emergencyContacts.map((contact, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{contact.name}</span>
                  </div>
                  {contact.isPrimary && (
                    <Badge variant="default">主要联系人</Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>关系:</span>
                    <span>{contact.relationship}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEmergencyCall(contact.phone)}
                    >
                      呼叫
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                用药信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cardData.medications.map((medication, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium text-sm">{medication.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {medication.dosage} · {medication.frequency}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                过敏信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cardData.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                急救二维码
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img 
                  src={cardData.qrCodeUrl} 
                  alt="急救二维码" 
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                紧急情况下，医护人员可扫描此二维码快速获取您的医疗信息
              </p>
              <div className="flex gap-2 mt-4 justify-center">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  下载
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareCard}>
                  <Share2 className="h-4 w-4 mr-2" />
                  分享
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MobileDashboardLayout>
  );
}