import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

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

// Extended mock data for medical facilities
const mockFacilities: MedicalFacility[] = [
  {
    id: '1',
    name: '中山大学肿瘤防治中心',
    type: 'specialty',
    specialty: ['肿瘤内科', '肿瘤外科', '放射肿瘤科', '血液科'],
    address: '广州市越秀区东风东路651号',
    phone: '020-87343088',
    distance: 2.3,
    rating: 4.8,
    reviewCount: 1245,
    isEmergency: true,
    hours: { open: '08:00', close: '17:30', is24Hour: false },
    services: ['化疗', '放疗', '手术', '免疫治疗', '精准医疗', '临床试验'],
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
    specialty: ['急诊科', '内科', '外科', '肿瘤科', '心血管科'],
    address: '广州市越秀区盘福路1号',
    phone: '020-81048888',
    distance: 1.8,
    rating: 4.5,
    reviewCount: 890,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '住院', '手术', '检查', '化验', 'ICU'],
    coordinates: { lat: 23.1200, lng: 113.2500 },
    waitTime: '约45分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '3',
    name: '南方医科大学南方医院',
    type: 'hospital',
    specialty: ['肿瘤科', '血液科', '内科', '外科', '神经科'],
    address: '广州市白云区广州大道北1838号',
    phone: '020-61641888',
    distance: 5.2,
    rating: 4.7,
    reviewCount: 1560,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '肿瘤治疗', '血液病', '移植', '康复', '中医科'],
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
    specialty: ['心血管科', '肿瘤科', '神经科', '内科', '急诊科'],
    address: '广州市越秀区中山二路106号',
    phone: '020-83827812',
    distance: 3.1,
    rating: 4.6,
    reviewCount: 2100,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '心脏病', '肿瘤', '神经疾病', '微创手术', '介入治疗'],
    coordinates: { lat: 23.1167, lng: 113.2833 },
    waitTime: '约40分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '5',
    name: '广州华侨医院肿瘤科',
    type: 'clinic',
    specialty: ['肿瘤内科', '肿瘤外科', '放射科'],
    address: '广州市天河区黄埔大道西613号',
    phone: '020-38688888',
    distance: 4.8,
    rating: 4.3,
    reviewCount: 456,
    isEmergency: false,
    hours: { open: '08:30', close: '17:00', is24Hour: false },
    services: ['门诊', '化疗', '靶向治疗', '随访', '营养咨询'],
    coordinates: { lat: 23.1200, lng: 113.3500 },
    waitTime: '约20分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '6',
    name: '中山大学附属第一医院',
    type: 'hospital',
    specialty: ['肿瘤科', '血液科', '消化内科', '呼吸内科', '急诊科'],
    address: '广州市越秀区中山二路58号',
    phone: '020-28823388',
    distance: 2.8,
    rating: 4.7,
    reviewCount: 1876,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '肿瘤诊疗', '血液病', '内镜检查', '病理诊断'],
    coordinates: { lat: 23.1180, lng: 113.2720 },
    waitTime: '约50分钟',
    acceptsInsurance: true,
    hasAppointments: true,
    website: 'https://www.gzsums.edu.cn',
  },
  {
    id: '7',
    name: '广州医科大学附属第二医院',
    type: 'hospital',
    specialty: ['肿瘤科', '胸外科', '呼吸内科', '麻醉科'],
    address: '广州市海珠区昌岗东路250号',
    phone: '020-34152299',
    distance: 6.1,
    rating: 4.4,
    reviewCount: 734,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '胸部肿瘤', '呼吸疾病', '微创手术', '疼痛治疗'],
    coordinates: { lat: 23.0900, lng: 113.2600 },
    waitTime: '约35分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
  {
    id: '8',
    name: '广东省第二人民医院',
    type: 'hospital',
    specialty: ['急诊科', '内科', '外科', '妇科', '儿科'],
    address: '广州市海珠区新港中路466号',
    phone: '020-89168114',
    distance: 7.2,
    rating: 4.2,
    reviewCount: 892,
    isEmergency: true,
    hours: { open: '00:00', close: '23:59', is24Hour: true },
    services: ['急诊', '综合内科', '普通外科', '妇产科', '儿科急诊'],
    coordinates: { lat: 23.0800, lng: 113.2800 },
    waitTime: '约25分钟',
    acceptsInsurance: true,
    hasAppointments: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const specialty = searchParams.get('specialty');
    const emergency = searchParams.get('emergency');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    let facilities = [...mockFacilities];

    // Filter by type
    if (type && type !== 'all') {
      facilities = facilities.filter(facility => facility.type === type);
    }

    // Filter by specialty
    if (specialty && specialty !== 'all') {
      facilities = facilities.filter(facility => 
        facility.specialty?.includes(specialty)
      );
    }

    // Filter emergency facilities
    if (emergency === 'true') {
      facilities = facilities.filter(facility => facility.isEmergency);
    }

    // Calculate distance if user location is provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      facilities = facilities.map(facility => ({
        ...facility,
        distance: calculateDistance(
          userLat, userLng,
          facility.coordinates.lat, facility.coordinates.lng
        )
      }));
    }

    // Sort by distance
    facilities.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      success: true,
      facilities,
      total: facilities.length,
    });
  } catch (error) {
    console.error('Error fetching medical resources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { facilityId, action, rating, review } = body;

    // Mock handling of user actions
    switch (action) {
      case 'favorite':
        // Add to user favorites
        return NextResponse.json({
          success: true,
          message: '已添加到收藏',
        });
      
      case 'rate':
        // Submit rating and review
        return NextResponse.json({
          success: true,
          message: '评价已提交',
        });
      
      case 'report_wait_time':
        // Update wait time information
        return NextResponse.json({
          success: true,
          message: '等候时间已更新',
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing medical resource action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}