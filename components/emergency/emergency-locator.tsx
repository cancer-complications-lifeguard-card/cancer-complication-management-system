'use client';

import { useState, useEffect } from 'react';
import { Phone, MapPin, Navigation, Clock, AlertTriangle, Car, Ambulance } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyFacility {
  id: string;
  name: string;
  type: 'hospital' | 'emergency_center' | 'clinic';
  address: string;
  phone: string;
  distance: number;
  estimatedArrival: string;
  isOpen: boolean;
  hasEmergency: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: 'high' | 'medium' | 'low';
  specialties: string[];
}

interface EmergencyLocatorProps {
  onEmergencyCall?: (phone: string) => void;
  onNavigate?: (facility: EmergencyFacility) => void;
}

const emergencyFacilities: EmergencyFacility[] = [
  {
    id: '1',
    name: '中山大学肿瘤防治中心急诊科',
    type: 'hospital',
    address: '广州市越秀区东风东路651号',
    phone: '020-87343088',
    distance: 1.2,
    estimatedArrival: '8分钟',
    isOpen: true,
    hasEmergency: true,
    coordinates: { lat: 23.1291, lng: 113.2644 },
    capacity: 'high',
    specialties: ['肿瘤急症', '化疗并发症', '疼痛治疗'],
  },
  {
    id: '2',
    name: '广州市第一人民医院急诊科',
    type: 'emergency_center',
    address: '广州市越秀区盘福路1号',
    phone: '020-81048888',
    distance: 0.8,
    estimatedArrival: '5分钟',
    isOpen: true,
    hasEmergency: true,
    coordinates: { lat: 23.1200, lng: 113.2500 },
    capacity: 'medium',
    specialties: ['急诊内科', '急诊外科', '抢救'],
  },
  {
    id: '3',
    name: '广东省人民医院急诊科',
    type: 'hospital',
    address: '广州市越秀区中山二路106号',
    phone: '020-83827812',
    distance: 1.5,
    estimatedArrival: '10分钟',
    isOpen: true,
    hasEmergency: true,
    coordinates: { lat: 23.1167, lng: 113.2833 },
    capacity: 'high',
    specialties: ['心血管急症', '神经急症', '肿瘤急症'],
  },
];

export function EmergencyLocator({ onEmergencyCall, onNavigate }: EmergencyLocatorProps) {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortedFacilities, setSortedFacilities] = useState<EmergencyFacility[]>(emergencyFacilities);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleEmergencyCall = (phone: string) => {
    if (onEmergencyCall) {
      onEmergencyCall(phone);
    } else {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleNavigate = (facility: EmergencyFacility) => {
    if (onNavigate) {
      onNavigate(facility);
    } else {
      const url = `https://maps.google.com/?q=${facility.coordinates.lat},${facility.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const getCapacityColor = (capacity: string) => {
    switch (capacity) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCapacityLabel = (capacity: string) => {
    switch (capacity) {
      case 'high':
        return '充足';
      case 'medium':
        return '紧张';
      case 'low':
        return '饱和';
      default:
        return '未知';
    }
  };

  return (
    <div className="space-y-6">
      {/* Emergency Actions */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800 mb-3">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-semibold">紧急情况</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            className="bg-red-600 hover:bg-red-700 w-full"
            onClick={() => handleEmergencyCall('120')}
          >
            <Ambulance className="h-4 w-4 mr-2" />
            拨打120急救
          </Button>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 w-full"
            onClick={() => handleEmergencyCall('110')}
          >
            <Phone className="h-4 w-4 mr-2" />
            拨打110报警
          </Button>
        </div>
      </div>

      {/* Location Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            当前位置
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLocating ? (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>正在定位...</span>
            </div>
          ) : userLocation ? (
            <div className="text-green-600">
              <p>定位成功，正在搜索附近的急诊科</p>
              <p className="text-sm text-gray-600 mt-1">
                位置: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          ) : (
            <div className="text-gray-600">
              <p>无法获取当前位置</p>
              <Button
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
                className="mt-2"
              >
                重新定位
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby Emergency Facilities */}
      <div>
        <h3 className="text-lg font-semibold mb-4">附近急诊科</h3>
        <div className="space-y-4">
          {sortedFacilities.map((facility) => (
            <Card key={facility.id} className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{facility.name}</CardTitle>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{facility.distance}km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Car className="h-4 w-4" />
                        <span>{facility.estimatedArrival}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{facility.isOpen ? '营业中' : '已关闭'}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getCapacityColor(facility.capacity)}>
                    床位{getCapacityLabel(facility.capacity)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">地址</p>
                    <p className="text-sm text-gray-600">{facility.address}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">专科服务</p>
                    <div className="flex flex-wrap gap-1">
                      {facility.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => handleEmergencyCall(facility.phone)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      立即致电
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleNavigate(facility)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      导航前往
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Emergency Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">紧急情况处理提示</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• 保持冷静，准确描述症状</li>
            <li>• 携带身份证、医保卡和病历</li>
            <li>• 如有家属陪同更好</li>
            <li>• 记录症状开始时间和发展过程</li>
            <li>• 如有用药史请详细说明</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}