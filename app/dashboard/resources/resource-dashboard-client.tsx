'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalResourceNavigator } from '@/components/navigation/medical-resource-navigator';
import { MapPin, Heart, Calendar, Star } from 'lucide-react';

interface ResourceDashboardClientProps {
  userId: number;
}

export function ResourceDashboardClient({ userId }: ResourceDashboardClientProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="navigator" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="navigator" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            资源导航
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            收藏夹
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            预约记录
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            我的评价
          </TabsTrigger>
        </TabsList>

        <TabsContent value="navigator">
          <MedicalResourceNavigator userId={userId} />
        </TabsContent>

        <TabsContent value="favorites">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">收藏夹</h3>
            <p className="text-gray-500">管理您收藏的医疗机构</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">预约记录</h3>
            <p className="text-gray-500">查看和管理您的预约记录</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">我的评价</h3>
            <p className="text-gray-500">查看您对医疗机构的评价</p>
            <p className="text-sm text-gray-400 mt-2">此功能正在开发中</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}