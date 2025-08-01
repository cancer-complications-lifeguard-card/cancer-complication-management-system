'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

// 模拟的医疗术语数据（扩展到更多数据）
const MEDICAL_TERMS = [
  { id: 1, term: '化疗', category: '治疗方法', description: '化学治疗，使用化学药物来杀死或控制癌细胞的治疗方法。' },
  { id: 2, term: '放疗', category: '治疗方法', description: '放射治疗，使用高能射线来破坏癌细胞的治疗方法。' },
  { id: 3, term: '免疫治疗', category: '治疗方法', description: '利用人体自身免疫系统来对抗癌症的治疗方法。' },
  { id: 4, term: '肿瘤标志物', category: '检查指标', description: '血液中可以反映肿瘤存在和发展的特殊物质。' },
  { id: 5, term: '转移', category: '病理概念', description: '癌细胞从原发部位扩散到身体其他部位的过程。' },
  { id: 6, term: '靶向治疗', category: '治疗方法', description: '针对癌细胞特定分子靶点的精准治疗方法。' },
  { id: 7, term: '病理分期', category: '诊断概念', description: '根据肿瘤的大小、侵犯范围和转移情况来确定病情发展阶段。' },
  { id: 8, term: '生存期', category: '预后指标', description: '从诊断或治疗开始到死亡或随访终点的时间。' },
  { id: 9, term: '复发', category: '病理概念', description: '经过治疗后癌症再次出现的情况。' },
  { id: 10, term: '缓解', category: '疗效评估', description: '肿瘤缩小或症状减轻的治疗效果。' },
  { id: 11, term: '副作用', category: '治疗概念', description: '治疗过程中出现的不良反应或并发症。' },
  { id: 12, term: 'CT扫描', category: '检查方法', description: '计算机断层扫描，用于检查体内结构的影像学方法。' },
  { id: 13, term: 'PET-CT', category: '检查方法', description: '正电子发射断层扫描，用于检测癌细胞代谢活动的高级影像学检查。' },
  { id: 14, term: '活检', category: '诊断方法', description: '取出组织样本进行病理学检查以确诊疾病的方法。' },
  { id: 15, term: '姑息治疗', category: '治疗方法', description: '以减轻症状、提高生活质量为目标的综合治疗方法。' }
];

// 分页配置
const ITEMS_PER_PAGE = 5;

export function MedicalTermsClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTerms, setFilteredTerms] = useState(MEDICAL_TERMS);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // 搜索时重置到第一页
    
    if (!value.trim()) {
      setFilteredTerms(MEDICAL_TERMS);
      return;
    }
    
    const filtered = MEDICAL_TERMS.filter(term =>
      term.term.toLowerCase().includes(value.toLowerCase()) ||
      term.description.toLowerCase().includes(value.toLowerCase()) ||
      term.category.toLowerCase().includes(value.toLowerCase())
    );
    
    setFilteredTerms(filtered);
  };

  // 计算分页数据
  const totalPages = Math.ceil(filteredTerms.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTerms = filteredTerms.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="搜索医疗术语..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 术语列表 */}
      <div className="space-y-3">
        {currentTerms.length > 0 ? (
          currentTerms.map((term) => (
            <div key={term.id} className="p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">{term.term}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {term.category}
                </span>
              </div>
              <p className="text-sm text-gray-600">{term.description}</p>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-4">
            {searchTerm ? '没有找到相关术语' : '暂无数据'}
          </div>
        )}
      </div>

      {/* 分页控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-xs text-gray-500">
            显示 {startIndex + 1}-{Math.min(endIndex, filteredTerms.length)} 条，共 {filteredTerms.length} 条
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="h-8 w-8 p-0 text-xs"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* 统计信息 */}
      <div className="text-xs text-gray-500 text-center">
        医疗术语库共收录 {MEDICAL_TERMS.length} 个术语
      </div>
    </div>
  );
}