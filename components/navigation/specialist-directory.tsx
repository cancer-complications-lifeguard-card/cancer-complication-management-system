'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Calendar, MapPin, Phone, User, Award, Clock, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Specialist {
  id: string;
  name: string;
  title: string;
  specialty: string;
  subSpecialty?: string[];
  hospital: string;
  department: string;
  experience: number;
  education: string[];
  certifications: string[];
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableSlots: {
    date: string;
    time: string;
    available: boolean;
  }[];
  languages: string[];
  researchAreas: string[];
  publications: number;
  phone: string;
  email: string;
  bio: string;
  isOnline: boolean;
  nextAvailable: string;
}

interface SpecialistDirectoryProps {
  userId: number;
}

const cancerSpecialties = [
  { value: 'all', label: '全部专科' },
  { value: '肿瘤内科', label: '肿瘤内科' },
  { value: '肿瘤外科', label: '肿瘤外科' },
  { value: '放射肿瘤科', label: '放射肿瘤科' },
  { value: '血液科', label: '血液科' },
  { value: '乳腺外科', label: '乳腺外科' },
  { value: '胸外科', label: '胸外科' },
  { value: '消化内科', label: '消化内科' },
  { value: '泌尿外科', label: '泌尿外科' },
  { value: '妇科肿瘤', label: '妇科肿瘤' },
  { value: '儿童肿瘤', label: '儿童肿瘤' },
  { value: '神经外科', label: '神经外科' },
  { value: '核医学科', label: '核医学科' },
];

const mockSpecialists: Specialist[] = [
  {
    id: 's1',
    name: '张明教授',
    title: '主任医师、教授、博士生导师',
    specialty: '肿瘤内科',
    subSpecialty: ['肺癌', '消化道肿瘤', '免疫治疗'],
    hospital: '中山大学肿瘤防治中心',
    department: '内科',
    experience: 25,
    education: ['北京医科大学医学博士', '哈佛大学医学院博士后'],
    certifications: ['中华医学会肿瘤学分会委员', 'ASCO会员', 'ESMO会员'],
    rating: 4.9,
    reviewCount: 543,
    consultationFee: 300,
    availableSlots: [
      { date: '2024-01-15', time: '09:00', available: true },
      { date: '2024-01-15', time: '14:00', available: false },
      { date: '2024-01-16', time: '10:30', available: true },
    ],
    languages: ['中文', 'English'],
    researchAreas: ['精准医疗', '免疫治疗', '分子靶向治疗'],
    publications: 156,
    phone: '020-87343001',
    email: 'zhang.ming@sysucc.org.cn',
    bio: '张明教授从事肿瘤内科临床工作25年，在肺癌和消化道肿瘤的诊治方面积累了丰富经验。主持国家自然科学基金项目3项，发表SCI论文150余篇。',
    isOnline: true,
    nextAvailable: '今日 14:30',
  },
  {
    id: 's2',
    name: '李华主任',
    title: '主任医师、副教授',
    specialty: '肿瘤外科',
    subSpecialty: ['乳腺癌', '甲状腺肿瘤', '微创手术'],
    hospital: '南方医科大学南方医院',
    department: '乳腺科',
    experience: 18,
    education: ['中山大学医学博士', '美国MD安德森癌症中心访问学者'],
    certifications: ['中国抗癌协会乳腺癌专委会委员', '广东省医师协会乳腺外科分会副主委'],
    rating: 4.8,
    reviewCount: 387,
    consultationFee: 250,
    availableSlots: [
      { date: '2024-01-15', time: '08:30', available: true },
      { date: '2024-01-16', time: '13:00', available: true },
    ],
    languages: ['中文'],
    researchAreas: ['乳腺癌手术治疗', '保乳手术', '乳房重建'],
    publications: 89,
    phone: '020-61641002',
    email: 'li.hua@nfyy.com',
    bio: '李华主任专注于乳腺肿瘤的外科治疗，擅长各种乳腺癌根治术、保乳手术及乳房重建术，手术例数超过3000例。',
    isOnline: false,
    nextAvailable: '明日 09:00',
  },
  {
    id: 's3',
    name: '王建国教授',
    title: '教授、主任医师、科室主任',
    specialty: '放射肿瘤科',
    subSpecialty: ['精确放疗', '立体定向放疗', '质子治疗'],
    hospital: '广东省人民医院',
    department: '放疗科',
    experience: 22,
    education: ['复旦大学医学博士', '德国海德堡质子治疗中心进修'],
    certifications: ['中华医学会放射肿瘤学分会副主委', 'ASTRO会员'],
    rating: 4.9,
    reviewCount: 298,
    consultationFee: 280,
    availableSlots: [
      { date: '2024-01-17', time: '10:00', available: true },
      { date: '2024-01-18', time: '15:30', available: true },
    ],
    languages: ['中文', 'English', 'Deutsch'],
    researchAreas: ['精确放疗技术', '放疗生物学', 'AI在放疗中的应用'],
    publications: 201,
    phone: '020-83827003',
    email: 'wang.jg@gdph.org.cn',
    bio: '王建国教授是国内放射肿瘤学领域的知名专家，在精确放疗和立体定向放疗方面有深入研究，率先在华南地区开展质子治疗。',
    isOnline: true,
    nextAvailable: '今日 16:00',
  },
  {
    id: 's4',
    name: '陈晓梅主任',
    title: '主任医师',
    specialty: '血液科',
    subSpecialty: ['白血病', '淋巴瘤', '造血干细胞移植'],
    hospital: '中山大学附属第一医院',
    department: '血液科',
    experience: 20,
    education: ['上海交通大学医学博士', '美国纪念斯隆-凯特琳癌症中心进修'],
    certifications: ['中华医学会血液学分会委员', '中国医师协会血液科医师分会常委'],
    rating: 4.7,
    reviewCount: 425,
    consultationFee: 260,
    availableSlots: [
      { date: '2024-01-16', time: '09:30', available: true },
      { date: '2024-01-17', time: '14:00', available: false },
    ],
    languages: ['中文', 'English'],
    researchAreas: ['急性白血病治疗', '淋巴瘤诊断', 'CAR-T治疗'],
    publications: 134,
    phone: '020-28823004',
    email: 'chen.xm@mail.sysu.edu.cn',
    bio: '陈晓梅主任在血液系统肿瘤诊治方面经验丰富，特别擅长急性白血病和淋巴瘤的个体化治疗，在CAR-T细胞治疗领域有重要贡献。',
    isOnline: false,
    nextAvailable: '明日 08:00',
  },
];

export function SpecialistDirectory({ userId }: SpecialistDirectoryProps) {
  const [specialists, setSpecialists] = useState<Specialist[]>(mockSpecialists);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>(mockSpecialists);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [sortBy, setSortBy] = useState('rating');
  const [filterOnline, setFilterOnline] = useState(false);

  useEffect(() => {
    filterAndSortSpecialists();
  }, [searchTerm, selectedSpecialty, sortBy, filterOnline, specialists]);

  const filterAndSortSpecialists = () => {
    let filtered = specialists;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(specialist => 
        specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.hospital.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.subSpecialty?.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by specialty
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(specialist => specialist.specialty === selectedSpecialty);
    }

    // Filter by online status
    if (filterOnline) {
      filtered = filtered.filter(specialist => specialist.isOnline);
    }

    // Sort specialists
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'fee':
          return a.consultationFee - b.consultationFee;
        case 'publications':
          return b.publications - a.publications;
        default:
          return 0;
      }
    });

    setFilteredSpecialists(filtered);
  };

  const bookAppointment = (specialist: Specialist) => {
    // Mock appointment booking
    alert(`正在为您预约${specialist.name}的门诊，请稍后...`);
  };

  const callSpecialist = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const renderSpecialistCard = (specialist: Specialist) => (
    <Card key={specialist.id} className="mb-4 hover:shadow-lg transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
              {specialist.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <CardTitle className="text-xl mb-1">{specialist.name}</CardTitle>
                <p className="text-sm text-gray-600 mb-2">{specialist.title}</p>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{specialist.specialty}</Badge>
                  {specialist.isOnline && (
                    <Badge variant="default" className="bg-green-600">
                      在线
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold">{specialist.rating}</span>
                  <span className="text-gray-500 text-sm">({specialist.reviewCount})</span>
                </div>
                <p className="text-sm text-gray-600">¥{specialist.consultationFee}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{specialist.hospital}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{specialist.experience}年经验</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>下次可约: {specialist.nextAvailable}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">专长领域:</p>
                <div className="flex flex-wrap gap-1">
                  {specialist.subSpecialty?.map((sub, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {sub}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            onClick={() => bookAppointment(specialist)}
            className="flex-1"
          >
            <Calendar className="h-4 w-4 mr-2" />
            预约挂号
          </Button>
          <Button 
            variant="outline"
            onClick={() => callSpecialist(specialist.phone)}
            className="flex-1"
          >
            <Phone className="h-4 w-4 mr-2" />
            咨询电话
          </Button>
          <Button 
            variant="outline"
            onClick={() => setSelectedSpecialist(specialist)}
          >
            <User className="h-4 w-4 mr-2" />
            详细信息
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSpecialistDetail = () => {
    if (!selectedSpecialist) return null;

    return (
      <Dialog open={!!selectedSpecialist} onOpenChange={() => setSelectedSpecialist(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                  {selectedSpecialist.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{selectedSpecialist.name}</h2>
                <p className="text-gray-600">{selectedSpecialist.title}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">基本信息</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">所属医院:</span> {selectedSpecialist.hospital}</p>
                    <p><span className="font-medium">科室:</span> {selectedSpecialist.department}</p>
                    <p><span className="font-medium">专科:</span> {selectedSpecialist.specialty}</p>
                    <p><span className="font-medium">从业经验:</span> {selectedSpecialist.experience}年</p>
                    <p><span className="font-medium">咨询费用:</span> ¥{selectedSpecialist.consultationFee}</p>
                    <p><span className="font-medium">发表论文:</span> {selectedSpecialist.publications}篇</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">联系方式</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">电话:</span> {selectedSpecialist.phone}</p>
                    <p><span className="font-medium">邮箱:</span> {selectedSpecialist.email}</p>
                    <p><span className="font-medium">语言:</span> {selectedSpecialist.languages.join(', ')}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">教育背景</h3>
                  <div className="space-y-1">
                    {selectedSpecialist.education.map((edu, index) => (
                      <p key={index} className="text-sm text-gray-600">• {edu}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">学术任职</h3>
                  <div className="space-y-1">
                    {selectedSpecialist.certifications.map((cert, index) => (
                      <p key={index} className="text-sm text-gray-600">• {cert}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">专长领域</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSpecialist.subSpecialty?.map((specialty, index) => (
                  <Badge key={index} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">研究方向</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSpecialist.researchAreas.map((area, index) => (
                  <Badge key={index} variant="secondary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">医生简介</h3>
              <p className="text-gray-700 leading-relaxed">{selectedSpecialist.bio}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={() => bookAppointment(selectedSpecialist)} className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                预约挂号
              </Button>
              <Button variant="outline" onClick={() => callSpecialist(selectedSpecialist.phone)}>
                <Phone className="h-4 w-4 mr-2" />
                电话咨询
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
        <h2 className="text-2xl font-bold">专科医生目录</h2>
        <Badge variant="outline" className="text-sm">
          共找到 {filteredSpecialists.length} 位医生
        </Badge>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索医生姓名、医院或专科..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cancerSpecialties.map((specialty) => (
                <SelectItem key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">按评分排序</SelectItem>
              <SelectItem value="experience">按经验排序</SelectItem>
              <SelectItem value="fee">按费用排序</SelectItem>
              <SelectItem value="publications">按学术成果</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={filterOnline ? "default" : "outline"}
            onClick={() => setFilterOnline(!filterOnline)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {filterOnline ? '仅在线医生' : '全部医生'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSpecialty('all');
              setSortBy('rating');
              setFilterOnline(false);
            }}
          >
            重置筛选
          </Button>
        </div>
      </div>

      {/* Results */}
      <div>
        {filteredSpecialists.length > 0 ? (
          filteredSpecialists.map(renderSpecialistCard)
        ) : (
          <div className="text-center py-12">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">未找到匹配的医生</h3>
            <p className="text-gray-500">请尝试修改搜索条件</p>
          </div>
        )}
      </div>

      {renderSpecialistDetail()}
    </div>
  );
}