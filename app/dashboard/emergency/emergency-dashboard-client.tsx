'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmergencyCardManager } from '@/components/emergency/emergency-card-manager';
import { EmergencyCallSystem } from '@/components/emergency/emergency-call-system';
import { QRCodeScanner } from '@/components/emergency/qr-code-scanner';
import { EmergencyLocator } from '@/components/emergency/emergency-locator';
import { MobileDashboardLayout } from '@/components/layout/mobile-dashboard-layout';
import { CreditCard, Phone, QrCode, MapPin, Shield } from 'lucide-react';

interface EmergencyDashboardClientProps {
  userId: number;
}

export function EmergencyDashboardClient({ userId }: EmergencyDashboardClientProps) {
  const [emergencyCardId, setEmergencyCardId] = useState<number | undefined>();

  useEffect(() => {
    fetchEmergencyCard();
  }, [userId]);

  const fetchEmergencyCard = async () => {
    try {
      const response = await fetch('/api/emergency-cards');
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setEmergencyCardId(data.id);
        }
      }
    } catch (error) {
      console.error('Error fetching emergency card:', error);
    }
  };

  return (
    <MobileDashboardLayout
      title="急救小红卡系统"
      subtitle="紧急情况下的生命救助工具"
      headerAction={
        <Shield className="h-6 w-6 text-red-600" />
      }
    >
      <Tabs defaultValue="card" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="card" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">急救卡管理</span>
            <span className="sm:hidden">急救卡</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">紧急呼叫</span>
            <span className="sm:hidden">呼叫</span>
          </TabsTrigger>
          <TabsTrigger value="scanner" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">扫码识别</span>
            <span className="sm:hidden">扫码</span>
          </TabsTrigger>
          <TabsTrigger value="locator" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">急救定位</span>
            <span className="sm:hidden">定位</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="card">
          <EmergencyCardManager userId={userId} />
        </TabsContent>

        <TabsContent value="calls">
          <EmergencyCallSystem userId={userId} emergencyCardId={emergencyCardId} />
        </TabsContent>

        <TabsContent value="scanner">
          <QRCodeScanner />
        </TabsContent>

        <TabsContent value="locator">
          <EmergencyLocator />
        </TabsContent>
      </Tabs>
    </MobileDashboardLayout>
  );
}