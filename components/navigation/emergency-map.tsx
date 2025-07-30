'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Navigation, AlertTriangle, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EmergencyFacility {
  id: string;
  name: string;
  address: string;
  phone: string;
  distance: number;
  rating: number;
  waitTime: string;
  isOpen: boolean;
  hasEmergencyRoom: boolean;
  hasOncology: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  emergencyServices: string[];
}

interface EmergencyMapProps {
  userLocation?: {
    lat: number;
    lng: number;
  };
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const mockEmergencyFacilities: EmergencyFacility[] = [
  {
    id: 'e1',
    name: '中山大学肿瘤防治中心急诊科',
    address: '广州市越秀区东风东路651号',
    phone: '020-87343088',
    distance: 1.2,
    rating: 4.9,
    waitTime: '15分钟',
    isOpen: true,
    hasEmergencyRoom: true,
    hasOncology: true,
    coordinates: { lat: 23.1291, lng: 113.2644 },
    emergencyServices: ['肿瘤急症', '化疗急救', '疼痛处理', '感染控制'],
  },
  {
    id: 'e2',
    name: '广州市第一人民医院急诊科',
    address: '广州市越秀区盘福路1号',
    phone: '020-81048888',
    distance: 2.1,
    rating: 4.6,
    waitTime: '25分钟',
    isOpen: true,
    hasEmergencyRoom: true,
    hasOncology: false,
    coordinates: { lat: 23.1200, lng: 113.2500 },
    emergencyServices: ['急诊抢救', '创伤外科', '心血管急诊', 'ICU'],
  },
  {
    id: 'e3',
    name: '南方医科大学南方医院急诊科',
    address: '广州市白云区广州大道北1838号',
    phone: '020-61641888',
    distance: 3.8,
    rating: 4.7,
    waitTime: '35分钟',
    isOpen: true,
    hasEmergencyRoom: true,
    hasOncology: true,
    coordinates: { lat: 23.1850, lng: 113.3200 },
    emergencyServices: ['血液病急诊', '肿瘤并发症', '造血干细胞移植急诊'],
  },
];

export function EmergencyMap({ userLocation, onLocationUpdate }: EmergencyMapProps) {
  const [facilities, setFacilities] = useState<EmergencyFacility[]>(mockEmergencyFacilities);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(userLocation);

  useEffect(() => {
    if (currentLocation) {
      // Update distances based on current location
      const updatedFacilities = facilities.map(facility => ({
        ...facility,
        distance: calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          facility.coordinates.lat,
          facility.coordinates.lng
        )
      }));
      updatedFacilities.sort((a, b) => a.distance - b.distance);
      setFacilities(updatedFacilities);
    }
  }, [currentLocation]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(newLocation);
          onLocationUpdate?.(newLocation);
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLocating(false);
          alert('无法获取当前位置，请检查位置权限设置');
        }
      );
    } else {
      alert('您的浏览器不支持地理定位功能');
      setIsLocating(false);
    }
  };

  const callEmergency = () => {
    window.location.href = 'tel:120';
  };

  const navigateToFacility = (facility: EmergencyFacility) => {
    const url = `https://maps.google.com/?q=${facility.coordinates.lat},${facility.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="space-y-6">
      {/* Emergency Header */}
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">紧急医疗服务</h3>
            <p className="text-red-700 mb-4">
              如遇生命威胁的紧急情况，请立即拨打120急救电话
            </p>
            <div className="flex gap-3">
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={callEmergency}
              >
                <Phone className="h-4 w-4 mr-2" />
                拨打120急救
              </Button>
              <Button
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isLocating}
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isLocating ? '定位中...' : '获取位置'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Location Status */}
      {currentLocation && (
        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200">
          <MapPin className="h-4 w-4 inline mr-1" />
          已获取您的位置，显示附近紧急医疗机构（按距离排序）
        </div>
      )}

      {/* Emergency Facilities List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">附近急诊科</h3>
        {facilities.map((facility) => (
          <Card 
            key={facility.id} 
            className={`transition-all hover:shadow-lg cursor-pointer ${
              selectedFacility?.id === facility.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedFacility(facility)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{facility.name}</CardTitle>
                    <div className="flex gap-1">
                      {facility.hasOncology && (
                        <Badge variant="secondary" className="text-xs">
                          肿瘤专科
                        </Badge>
                      )}
                      {facility.isOpen && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          营业中
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{facility.distance.toFixed(1)}km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{facility.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>等候 {facility.waitTime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      callFacility(facility.phone);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Phone className="h-4 w-4" />
                    拨打
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToFacility(facility);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Navigation className="h-4 w-4" />
                    导航
                  </Button>
                </div>
              </div>
            </CardHeader>
            {selectedFacility?.id === facility.id && (
              <CardContent>
                <div className="space-y-3 border-t pt-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">地址</p>
                    <p className="text-sm text-gray-600">{facility.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">紧急服务</p>
                    <div className="flex flex-wrap gap-1">
                      {facility.emergencyServices.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => callFacility(facility.phone)}
                      className="flex-1"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      立即拨打
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigateToFacility(facility)}
                      className="flex-1"
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      前往导航
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">快速操作</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open('tel:110')}>
            拨打110报警
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('tel:119')}>
            拨打119消防
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('tel:12320')}>
            卫生热线12320
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open('tel:400-161-9995')}>
            毒物咨询热线
          </Button>
        </div>
      </div>
    </div>
  );
}