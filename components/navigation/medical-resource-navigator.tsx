'use client';

import { useState, useEffect } from 'react';
import { MapPin, Phone, Clock, Star, Navigation, Filter, Search, ExternalLink } from 'lucide-react';
import { EmergencyMap } from './emergency-map';
import { SpecialistDirectory } from './specialist-directory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface MedicalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'emergency' | 'specialty';
  specialty?: string[];
  address: string;
  phone: string;
  distance: number;
  rating: number;
  reviewCount: number;
  isEmergency: boolean;
  hours: {
    open: string;
    close: string;
    is24Hour: boolean;
  };
  services: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  waitTime?: string;
  acceptsInsurance: boolean;
  hasAppointments: boolean;
  website?: string;
}

interface MedicalResourceNavigatorProps {
  userId: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

const facilityTypes = [
  { value: 'all', label: '全部' },
  { value: 'emergency', label: '急诊科' },
  { value: 'hospital', label: '综合医院' },
  { value: 'clinic', label: '专科诊所' },
  { value: 'specialty', label: '肿瘤专科' },
];

const specialties = [
  '肿瘤内科',
  '肿瘤外科',
  '放射肿瘤科',
  '血液科',
  '乳腺外科',
  '胸外科',
  '消化内科',
  '神经外科',
  '妇科肿瘤',
  '儿童肿瘤',
];

// Mock data for medical facilities
const mockFacilities: MedicalFacility[] = [
  {
    id: '1',
    name: '中山大学肿瘤防治中心',
    type: 'specialty',
    specialty: ['肿瘤内科', '肿瘤外科', '放射肿瘤科'],
    address: '广州市越秀区东风东路651号',
    phone: '020-87343088',
    distance: 2.3,
    rating: 4.8,
    reviewCount: 1245,
    isEmergency: true,
    hours: {
      open: '08:00',
      close: '17:30',
      is24Hour: false,
    },
    services: ['化疗', '放疗', '手术', '免疫治疗', '精准医疗'],
    coordinates: { lat: 23.1291, lng: 113.2644 },
    waitTime: '约30分钟',
    acceptsInsurance: true,
    hasAppointments: true,
    website: 'https://www.sysucc.org.cn',
  },
  {
    id: '2',
    name: '广州市第一人民医院',
    type: 'hospital',
    specialty: ['急诊科', '内科', '外科', '肿瘤科'],
    address: '广州市越秀区盘福路1号',
    phone: '020-81048888',
    distance: 1.8,
    rating: 4.5,
    reviewCount: 890,
    isEmergency: true,
    hours: {
      open: '00:00',
      close: '23:59',
      is24Hour: true,
    },
    services: ['急诊', '住院', '手术', '检查', '化验'],
    coordinates: { lat: 23.1200, lng: 113.2500 },
    waitTime: '约45分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '3',
    name: '南方医科大学南方医院',
    type: 'hospital',
    specialty: ['肿瘤科', '血液科', '内科', '外科'],
    address: '广州市白云区广州大道北1838号',
    phone: '020-61641888',
    distance: 5.2,
    rating: 4.7,
    reviewCount: 1560,
    isEmergency: true,
    hours: {
      open: '00:00',
      close: '23:59',
      is24Hour: true,
    },
    services: ['急诊', '肿瘤治疗', '血液病', '移植', '康复'],
    coordinates: { lat: 23.1850, lng: 113.3200 },
    waitTime: '约60分钟',
    acceptsInsurance: true,
    hasAppointments: true,
    website: 'https://www.nfyy.com',
  },
  {
    id: '4',
    name: '广东省人民医院',
    type: 'hospital',
    specialty: ['心血管科', '肿瘤科', '神经科', '内科'],
    address: '广州市越秀区中山二路106号',
    phone: '020-83827812',
    distance: 3.1,
    rating: 4.6,
    reviewCount: 2100,
    isEmergency: true,
    hours: {
      open: '00:00',
      close: '23:59',
      is24Hour: true,
    },
    services: ['急诊', '心脏病', '肿瘤', '神经疾病', '微创手术'],
    coordinates: { lat: 23.1167, lng: 113.2833 },
    waitTime: '约40分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '5',
    name: '广州华侨医院肿瘤科',
    type: 'clinic',
    specialty: ['肿瘤内科', '肿瘤外科'],
    address: '广州市天河区黄埔大道西613号',
    phone: '020-38688888',
    distance: 4.8,
    rating: 4.3,
    reviewCount: 456,
    isEmergency: false,
    hours: {
      open: '08:30',
      close: '17:00',
      is24Hour: false,
    },
    services: ['门诊', '化疗', '靶向治疗', '随访'],
    coordinates: { lat: 23.1200, lng: 113.3500 },
    waitTime: '约20分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
];

export function MedicalResourceNavigator({ userId, currentLocation }: MedicalResourceNavigatorProps) {
  const [facilities, setFacilities] = useState<MedicalFacility[]>(mockFacilities);
  const [filteredFacilities, setFilteredFacilities] = useState<MedicalFacility[]>(mockFacilities);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedFacility, setSelectedFacility] = useState<MedicalFacility | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState(currentLocation);

  useEffect(() => {
    filterFacilities();
  }, [searchTerm, selectedType, selectedSpecialty, facilities]);

  const filterFacilities = () => {
    let filtered = facilities;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(facility => 
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.specialty?.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(facility => facility.type === selectedType);
    }

    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(facility => 
        facility.specialty?.includes(selectedSpecialty)
      );
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    setFilteredFacilities(filtered);
  };

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
        }
      );
    } else {
      alert('您的浏览器不支持地理定位');
      setIsLocating(false);
    }
  };

  const openInMaps = (facility: MedicalFacility) => {
    const url = `https://maps.google.com/?q=${facility.coordinates.lat},${facility.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const callFacility = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const getEmergencyFacilities = () => {
    return facilities.filter(f => f.isEmergency).sort((a, b) => a.distance - b.distance);
  };

  const renderFacilityCard = (facility: MedicalFacility) => (
    <Card key={facility.id} className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{facility.name}</CardTitle>
              {facility.isEmergency && (
                <Badge variant="destructive" className="text-xs">
                  急诊
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{facility.distance.toFixed(1)}km</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{facility.rating}</span>
                <span className="text-gray-500">({facility.reviewCount})</span>
              </div>
              {facility.waitTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{facility.waitTime}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => callFacility(facility.phone)}
              className="flex items-center gap-1"
            >
              <Phone className="h-4 w-4" />
              拨打
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openInMaps(facility)}
              className="flex items-center gap-1"
            >
              <Navigation className="h-4 w-4" />
              导航
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">地址</p>
            <p className="text-sm text-gray-600">{facility.address}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">专科</p>
            <div className="flex flex-wrap gap-1">
              {facility.specialty?.map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">服务</p>
            <div className="flex flex-wrap gap-1">
              {facility.services.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">营业时间:</span>
              <span className="ml-2">
                {facility.hours.is24Hour ? '24小时' : `${facility.hours.open}-${facility.hours.close}`}
              </span>
            </div>
            <div>
              <span className="font-medium">医保:</span>
              <span className="ml-2">
                {facility.acceptsInsurance ? '✓ 可用' : '✗ 不可用'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFacility(facility)}
              className="flex-1"
            >
              详细信息
            </Button>
            {facility.hasAppointments && (
              <Button size="sm" className="flex-1">
                预约挂号
              </Button>
            )}
            {facility.website && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(facility.website, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEmergencyPanel = () => {
    const emergencyFacilities = getEmergencyFacilities();
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <Phone className="h-5 w-5" />
            <span className="font-semibold">紧急情况</span>
          </div>
          <p className="text-red-700 mb-3">如遇生命危险，请立即拨打急救电话</p>
          <div className="flex gap-2">
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => callFacility('120')}
            >
              拨打120急救
            </Button>
            <Button
              variant="outline"
              onClick={() => callFacility('110')}
            >
              拨打110报警
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">附近急诊科</h3>
          {emergencyFacilities.slice(0, 3).map(renderFacilityCard)}
        </div>
      </div>
    );
  };

  const renderFacilityDetail = () => {
    if (!selectedFacility) return null;

    return (
      <Dialog open={!!selectedFacility} onOpenChange={() => setSelectedFacility(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedFacility.name}
              {selectedFacility.isEmergency && (
                <Badge variant="destructive">急诊</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">距离</Label>
                <p className="text-sm">{selectedFacility.distance.toFixed(1)}km</p>
              </div>
              <div>
                <Label className="text-sm font-medium">评分</Label>
                <p className="text-sm">{selectedFacility.rating}/5.0 ({selectedFacility.reviewCount}评价)</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">地址</Label>
              <p className="text-sm">{selectedFacility.address}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">电话</Label>
              <p className="text-sm">{selectedFacility.phone}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">营业时间</Label>
              <p className="text-sm">
                {selectedFacility.hours.is24Hour ? '24小时营业' : `${selectedFacility.hours.open} - ${selectedFacility.hours.close}`}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">专科服务</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedFacility.specialty?.map((spec, index) => (
                  <Badge key={index} variant="outline">
                    {spec}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">医疗服务</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedFacility.services.map((service, index) => (
                  <Badge key={index} variant="secondary">
                    {service}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => callFacility(selectedFacility.phone)}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                拨打电话
              </Button>
              <Button 
                variant="outline"
                onClick={() => openInMaps(selectedFacility)}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-2" />
                导航前往
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">医疗资源导航</h2>
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isLocating ? '定位中...' : '当前位置'}
        </Button>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">搜索医院</TabsTrigger>
          <TabsTrigger value="emergency">紧急服务</TabsTrigger>
          <TabsTrigger value="specialists">专科医生</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索医院、地址或专科..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  {facilityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger>
                  <SelectValue placeholder="选择专科" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部专科</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedSpecialty('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                重置
              </Button>
            </div>

            {/* Results */}
            <div>
              <p className="text-sm text-gray-600 mb-4">
                找到 {filteredFacilities.length} 个医疗机构
              </p>
              {filteredFacilities.map(renderFacilityCard)}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emergency">
          <EmergencyMap 
            userLocation={userLocation}
            onLocationUpdate={setUserLocation}
          />
        </TabsContent>

        <TabsContent value="specialists">
          <SpecialistDirectory userId={userId} />
        </TabsContent>
      </Tabs>

      {renderFacilityDetail()}
    </div>
  );
}