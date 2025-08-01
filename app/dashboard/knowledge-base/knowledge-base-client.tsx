'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, BookOpen, Stethoscope, Calendar, ExternalLink, Download } from 'lucide-react';

// 知识库分类
const KNOWLEDGE_CATEGORIES = {
  NCCN: { label: 'NCCN指南', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  LITERATURE: { label: '医学文献', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  TREATMENT: { label: '治疗方案', icon: Stethoscope, color: 'bg-purple-100 text-purple-800' },
  GUIDELINES: { label: '临床指南', icon: Calendar, color: 'bg-orange-100 text-orange-800' }
};

// 模拟的知识库数据
const KNOWLEDGE_BASE_DATA = [
  {
    id: 1,
    title: 'NCCN肺癌临床指南（2024版）',
    category: 'NCCN',
    description: '非小细胞肺癌的筛查、诊断、分期和治疗全流程指南，包含最新的免疫治疗和靶向治疗方案。',
    publishDate: '2024-01-15',
    author: 'NCCN委员会',
    tags: ['肺癌', '免疫治疗', '靶向治疗'],
    url: '#',
    downloadable: true,
    featured: true
  },
  {
    id: 2,
    title: 'PD-1/PD-L1抑制剂在实体肿瘤中的应用',
    category: 'LITERATURE',
    description: '系统分析PD-1/PD-L1免疫检查点抑制剂在不同实体肿瘤中的疗效和安全性数据。',
    publishDate: '2024-02-20',
    author: 'Journal of Clinical Oncology',
    tags: ['免疫治疗', 'PD-1', 'PD-L1'],
    url: '#',
    downloadable: false,
    featured: true
  },
  {
    id: 3,
    title: '乳腺癌新辅助化疗标准方案',
    category: 'TREATMENT',
    description: 'HER2阳性和三阴性乳腺癌的新辅助治疗方案选择和疗效评估标准。',
    publishDate: '2024-01-30',
    author: '中国抗癌协会',
    tags: ['乳腺癌', '新辅助治疗', 'HER2'],
    url: '#',
    downloadable: true,
    featured: false
  },
  {
    id: 4,
    title: '结直肠癌分子分型与精准治疗指南',
    category: 'GUIDELINES',
    description: '基于基因突变状态的结直肠癌个体化治疗策略和用药指导原则。',
    publishDate: '2023-12-10',
    author: 'CSCO',
    tags: ['结直肠癌', '分子分型', '精准治疗'],
    url: '#',
    downloadable: true,
    featured: false
  },
  {
    id: 5,
    title: '肿瘤免疫治疗相关不良反应管理专家共识',
    category: 'GUIDELINES',
    description: '免疫治疗相关不良反应的识别、分级、处理和预防策略的专家共识意见。',
    publishDate: '2024-02-05',
    author: '中华医学会肿瘤学分会',
    tags: ['免疫治疗', '不良反应', '安全管理'],
    url: '#',
    downloadable: true,
    featured: true
  },
  {
    id: 6,
    title: 'CAR-T细胞治疗血液肿瘤临床研究进展',
    category: 'LITERATURE',
    description: 'CAR-T细胞治疗在B细胞急性淋巴细胞白血病和淋巴瘤中的最新临床研究结果。',
    publishDate: '2024-01-20',
    author: 'Nature Medicine',
    tags: ['CAR-T', '血液肿瘤', '细胞治疗'],
    url: '#',
    downloadable: false,
    featured: false
  },
  {
    id: 7,
    title: '胃癌围手术期综合治疗规范',
    category: 'TREATMENT',
    description: '胃癌患者围手术期的营养支持、新辅助治疗和术后辅助治疗的标准化方案。',
    publishDate: '2023-11-25',
    author: '中国医师协会外科医师分会',
    tags: ['胃癌', '围手术期', '综合治疗'],
    url: '#',
    downloadable: true,
    featured: false
  },
  {
    id: 8,
    title: '肝癌介入治疗技术规范（2024修订版）',
    category: 'NCCN',
    description: '肝动脉化疗栓塞术（TACE）和射频消融等介入治疗技术的操作规范和适应证。',
    publishDate: '2024-02-28',
    author: '介入医学专委会',
    tags: ['肝癌', '介入治疗', 'TACE'],
    url: '#',
    downloadable: true,
    featured: false
  }
];

export function KnowledgeBaseClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [filteredData, setFilteredData] = useState(KNOWLEDGE_BASE_DATA);

  // 搜索和筛选逻辑
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    filterData(value, activeCategory);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    filterData(searchTerm, category);
  };

  const filterData = (search: string, category: string) => {
    let filtered = KNOWLEDGE_BASE_DATA;

    // 分类筛选
    if (category !== 'ALL') {
      filtered = filtered.filter(item => item.category === category);
    }

    // 搜索筛选
    if (search.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())) ||
        item.author.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  // 获取推荐内容
  const featuredItems = KNOWLEDGE_BASE_DATA.filter(item => item.featured);

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="搜索指南、文献、治疗方案..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 推荐内容 */}
      {!searchTerm && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">📌 推荐阅读</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredItems.slice(0, 3).map((item) => {
              const categoryConfig = KNOWLEDGE_CATEGORIES[item.category as keyof typeof KNOWLEDGE_CATEGORIES];
              const Icon = categoryConfig.icon;
              
              return (
                <Card key={item.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4" />
                      <Badge variant="secondary" className={categoryConfig.color}>
                        {categoryConfig.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm line-clamp-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{item.publishDate}</span>
                      <Button size="sm" variant="outline" className="h-7 px-2">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        查看
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 分类标签 */}
      <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
        <TabsList>
          <TabsTrigger value="ALL">全部</TabsTrigger>
          {Object.entries(KNOWLEDGE_CATEGORIES).map(([key, category]) => (
            <TabsTrigger key={key} value={key}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-6">
          {/* 内容列表 */}
          <div className="space-y-4">
            {filteredData.length > 0 ? (
              filteredData.map((item) => {
                const categoryConfig = KNOWLEDGE_CATEGORIES[item.category as keyof typeof KNOWLEDGE_CATEGORIES];
                const Icon = categoryConfig.icon;
                
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4" />
                            <Badge variant="secondary" className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                            {item.featured && (
                              <Badge variant="default" className="bg-red-100 text-red-800">
                                推荐
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
                          <p className="text-gray-600 mb-3">{item.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span>作者: {item.author}</span>
                            <span>发布: {item.publishDate}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="default">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            查看
                          </Button>
                          {item.downloadable && (
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              下载
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                没有找到相关内容
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 统计信息 */}
      <div className="text-center text-sm text-gray-500">
        知识库共收录 {KNOWLEDGE_BASE_DATA.length} 份医疗资料，当前显示 {filteredData.length} 份
      </div>
    </div>
  );
}