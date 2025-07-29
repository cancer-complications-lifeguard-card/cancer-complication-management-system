'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Book, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MedicalTerm, TermCategory } from '@/lib/db/schema';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface MedicalTermsBrowserProps {
  onTermSelect?: (term: MedicalTerm) => void;
  initialCategory?: TermCategory;
  showCategories?: boolean;
}

const categoryLabels = {
  [TermCategory.CANCER_TYPE]: '癌症类型',
  [TermCategory.SYMPTOM]: '症状',
  [TermCategory.TREATMENT]: '治疗',
  [TermCategory.MEDICATION]: '药物',
  [TermCategory.PROCEDURE]: '手术/程序',
  [TermCategory.COMPLICATION]: '并发症',
  [TermCategory.ANATOMY]: '解剖',
};

const categoryColors = {
  [TermCategory.CANCER_TYPE]: 'bg-red-100 text-red-800 border-red-200',
  [TermCategory.SYMPTOM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [TermCategory.TREATMENT]: 'bg-green-100 text-green-800 border-green-200',
  [TermCategory.MEDICATION]: 'bg-blue-100 text-blue-800 border-blue-200',
  [TermCategory.PROCEDURE]: 'bg-purple-100 text-purple-800 border-purple-200',
  [TermCategory.COMPLICATION]: 'bg-orange-100 text-orange-800 border-orange-200',
  [TermCategory.ANATOMY]: 'bg-gray-100 text-gray-800 border-gray-200',
};

interface SearchResult {
  terms: MedicalTerm[];
  totalResults: number;
  isLoading: boolean;
}

export function MedicalTermsBrowser({ 
  onTermSelect, 
  initialCategory,
  showCategories = true 
}: MedicalTermsBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TermCategory | 'all'>('all');
  const [searchResults, setSearchResults] = useState<SearchResult>({
    terms: [],
    totalResults: 0,
    isLoading: false
  });
  const [selectedTerm, setSelectedTerm] = useState<MedicalTerm | null>(null);
  const [relatedTerms, setRelatedTerms] = useState<MedicalTerm[]>([]);
  const [popularTerms, setPopularTerms] = useState<MedicalTerm[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search terms
  const searchTerms = useCallback(async (query: string, category?: TermCategory) => {
    if (!query.trim()) {
      setSearchResults({ terms: [], totalResults: 0, isLoading: false });
      return;
    }

    setSearchResults(prev => ({ ...prev, isLoading: true }));

    try {
      const params = new URLSearchParams({
        q: query,
        ...(category && category !== 'all' && { category })
      });

      const response = await fetch(`/api/medical-terms/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults({
          terms: data.terms,
          totalResults: data.totalResults,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error searching terms:', error);
      setSearchResults({ terms: [], totalResults: 0, isLoading: false });
    }
  }, []);

  // Get terms by category
  const getTermsByCategory = useCallback(async (category: TermCategory) => {
    setSearchResults(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch(`/api/medical-terms/category/${category}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults({
          terms: data.terms,
          totalResults: data.terms.length,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching terms by category:', error);
      setSearchResults({ terms: [], totalResults: 0, isLoading: false });
    }
  }, []);

  // Get related terms
  const getRelatedTerms = useCallback(async (termId: number) => {
    try {
      const response = await fetch(`/api/medical-terms/${termId}/related`);
      const data = await response.json();

      if (data.success) {
        setRelatedTerms(data.relatedTerms);
      }
    } catch (error) {
      console.error('Error fetching related terms:', error);
      setRelatedTerms([]);
    }
  }, []);

  // Get popular terms
  const getPopularTerms = useCallback(async () => {
    try {
      const response = await fetch('/api/medical-terms/popular');
      const data = await response.json();

      if (data.success) {
        setPopularTerms(data.terms);
      }
    } catch (error) {
      console.error('Error fetching popular terms:', error);
      setPopularTerms([]);
    }
  }, []);

  // Handle term selection
  const handleTermSelect = useCallback((term: MedicalTerm) => {
    setSelectedTerm(term);
    getRelatedTerms(term.id);
    onTermSelect?.(term);
  }, [onTermSelect, getRelatedTerms]);

  // Effects
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchTerms(debouncedSearchQuery, selectedCategory === 'all' ? undefined : selectedCategory as TermCategory);
    } else if (selectedCategory !== 'all') {
      getTermsByCategory(selectedCategory as TermCategory);
    } else {
      setSearchResults({ terms: [], totalResults: 0, isLoading: false });
    }
  }, [debouncedSearchQuery, selectedCategory, searchTerms, getTermsByCategory]);

  useEffect(() => {
    getPopularTerms();
  }, [getPopularTerms]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const renderTermCard = (term: MedicalTerm) => (
    <Card 
      key={term.id} 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleTermSelect(term)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{term.term}</CardTitle>
          <Badge className={`text-xs ${categoryColors[term.category as TermCategory]}`}>
            {categoryLabels[term.category as TermCategory]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 line-clamp-3">{term.definition}</p>
        {term.severity && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              严重程度: {term.severity}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索医疗术语..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        {showCategories && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              全部
            </Button>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key as TermCategory)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">搜索结果</TabsTrigger>
          <TabsTrigger value="details">术语详情</TabsTrigger>
          <TabsTrigger value="popular">热门术语</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {searchResults.isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">搜索中...</p>
            </div>
          ) : searchResults.terms.length > 0 ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                找到 {searchResults.totalResults} 个结果
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.terms.map(renderTermCard)}
              </div>
            </div>
          ) : debouncedSearchQuery || selectedCategory !== 'all' ? (
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">未找到相关术语</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">请输入搜索关键词或选择分类</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedTerm ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-2xl">{selectedTerm.term}</CardTitle>
                    <Badge className={`${categoryColors[selectedTerm.category as TermCategory]}`}>
                      {categoryLabels[selectedTerm.category as TermCategory]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">定义</h4>
                    <p className="text-gray-700">{selectedTerm.definition}</p>
                  </div>

                  {selectedTerm.aliases && Array.isArray(selectedTerm.aliases) && (
                    <div>
                      <h4 className="font-semibold mb-2">别名</h4>
                      <div className="flex flex-wrap gap-1">
                        {(selectedTerm.aliases as string[]).map((alias, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTerm.severity && (
                    <div>
                      <h4 className="font-semibold mb-2">严重程度</h4>
                      <Badge variant="outline">{selectedTerm.severity}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {relatedTerms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">相关术语</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {relatedTerms.map((term) => (
                        <div
                          key={term.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleTermSelect(term)}
                        >
                          <div>
                            <h5 className="font-medium">{term.term}</h5>
                            <p className="text-sm text-gray-600 line-clamp-1">{term.definition}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">请选择一个术语查看详细信息</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          {popularTerms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {popularTerms.map(renderTermCard)}
            </div>
          ) : (
            <div className="text-center py-8">
              <Book className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">暂无热门术语数据</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}