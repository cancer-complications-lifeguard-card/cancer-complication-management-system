'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, BookOpen, Flask, FileText, Star, TrendingUp, Clock, Bookmark } from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeBaseStats {
  nccnGuidelines: number;
  drugInteractions: number;
  clinicalTrials: number;
  knowledgeArticles: number;
  totalInteractions: number;
}

interface SearchResults {
  guidelines: any[];
  drugInteractions: any[];
  clinicalTrials: any[];
  articles: any[];
}

export default function KnowledgeBaseDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [featuredArticles, setFeaturedArticles] = useState<any[]>([]);
  const [popularContent, setPopularContent] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load initial data
  useEffect(() => {
    loadStats();
    loadFeaturedArticles();
    loadPopularContent();
    loadUserHistory();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/knowledge-base/search?stats=true');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      const response = await fetch('/api/knowledge-base/articles?featured=true&limit=5');
      const data = await response.json();
      if (data.success) {
        setFeaturedArticles(data.data);
      }
    } catch (error) {
      console.error('Error loading featured articles:', error);
    }
  };

  const loadPopularContent = async () => {
    try {
      const response = await fetch('/api/knowledge-base/articles?popular=true&limit=10');
      const data = await response.json();
      if (data.success) {
        setPopularContent(data.data);
      }
    } catch (error) {
      console.error('Error loading popular content:', error);
    }
  };

  const loadUserHistory = async () => {
    try {
      const response = await fetch('/api/knowledge-base/interactions?limit=10');
      const data = await response.json();
      if (data.success) {
        setUserHistory(data.data);
      }
    } catch (error) {
      console.error('Error loading user history:', error);
    }
  };

  const handleGlobalSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('请输入搜索内容');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-base/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data);
        setActiveTab('search');
        toast.success(`找到 ${data.metadata.totalResults} 条相关内容`);
      } else {
        toast.error('搜索失败，请重试');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGlobalSearch();
    }
  };

  const bookmarkContent = async (contentType: string, contentId: number) => {
    try {
      const response = await fetch('/api/knowledge-base/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          contentId,
          metadata: JSON.stringify({ bookmarked: true })
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('已添加到书签');
      } else {
        toast.error('添加书签失败');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('添加书签失败');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );

  const ContentCard = ({ item, type }: { item: any; type: string }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{type}</Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => bookmarkContent(type, item.id)}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {item.summary && (
          <CardDescription>{item.summary}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className=\"flex flex-wrap gap-2 mb-2\">
          {item.cancerType && <Badge variant=\"secondary\">{item.cancerType}</Badge>}
          {item.category && <Badge variant=\"secondary\">{item.category}</Badge>}
          {item.severity && <Badge variant={item.severity === 'major' ? 'destructive' : 'secondary'}>{item.severity}</Badge>}
          {item.phase && <Badge variant=\"secondary\">{item.phase}</Badge>}
          {item.status && <Badge variant=\"secondary\">{item.status}</Badge>}
        </div>
        {item.description && (
          <p className=\"text-sm text-gray-600 mb-2\">{item.description}</p>
        )}
        {item.briefSummary && (
          <p className=\"text-sm text-gray-600 mb-2\">{item.briefSummary}</p>
        )}
        {item.drugA && item.drugB && (
          <div className=\"text-sm\">
            <strong>药物交互:</strong> {item.drugA} ↔ {item.drugB}
          </div>
        )}
        {item.nctId && (
          <div className=\"text-sm\">
            <strong>NCT ID:</strong> {item.nctId}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className=\"container mx-auto p-6 space-y-6\">
      <div className=\"flex items-center justify-between\">
        <h1 className=\"text-3xl font-bold\">医疗知识库</h1>
        <div className=\"flex items-center space-x-4\">
          <div className=\"flex items-center space-x-2\">
            <Search className=\"h-5 w-5 text-gray-500\" />
            <Input
              placeholder=\"搜索指南、药物交互、临床试验、文章...\"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className=\"w-64\"
            />
            <Button onClick={handleGlobalSearch} disabled={loading}>
              {loading ? '搜索中...' : '搜索'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className=\"w-full\">
        <TabsList className=\"grid w-full grid-cols-5\">
          <TabsTrigger value=\"overview\">概览</TabsTrigger>
          <TabsTrigger value=\"search\">搜索结果</TabsTrigger>
          <TabsTrigger value=\"guidelines\">NCCN指南</TabsTrigger>
          <TabsTrigger value=\"trials\">临床试验</TabsTrigger>
          <TabsTrigger value=\"articles\">知识文章</TabsTrigger>
        </TabsList>

        <TabsContent value=\"overview\" className=\"space-y-6\">
          {/* Statistics Cards */}
          {stats && (
            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4\">
              <StatCard 
                title=\"NCCN指南\" 
                value={stats.nccnGuidelines} 
                icon={BookOpen} 
                color=\"text-blue-600\" 
              />
              <StatCard 
                title=\"药物交互\" 
                value={stats.drugInteractions} 
                icon={Flask} 
                color=\"text-red-600\" 
              />
              <StatCard 
                title=\"临床试验\" 
                value={stats.clinicalTrials} 
                icon={FileText} 
                color=\"text-green-600\" 
              />
              <StatCard 
                title=\"知识文章\" 
                value={stats.knowledgeArticles} 
                icon={FileText} 
                color=\"text-purple-600\" 
              />
              <StatCard 
                title=\"总访问量\" 
                value={stats.totalInteractions} 
                icon={TrendingUp} 
                color=\"text-orange-600\" 
              />
            </div>
          )}

          {/* Featured Articles */}
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            <Card>
              <CardHeader>
                <CardTitle className=\"flex items-center\">
                  <Star className=\"h-5 w-5 mr-2 text-yellow-500\" />
                  精选文章
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"space-y-4\">
                  {featuredArticles.map((article) => (
                    <div key={article.id} className=\"flex items-start space-x-3\">
                      <div className=\"flex-1\">
                        <h4 className=\"font-medium\">{article.title}</h4>
                        <p className=\"text-sm text-gray-600 mt-1\">{article.summary}</p>
                        <div className=\"flex items-center mt-2 space-x-2\">
                          <Badge variant=\"secondary\">{article.category}</Badge>
                          <Badge variant=\"outline\">{article.targetAudience}</Badge>
                          {article.rating && (
                            <div className=\"flex items-center text-sm text-gray-500\">
                              <Star className=\"h-3 w-3 mr-1 fill-yellow-400 text-yellow-400\" />
                              {article.rating}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className=\"flex items-center\">
                  <TrendingUp className=\"h-5 w-5 mr-2 text-green-500\" />
                  热门内容
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"space-y-4\">
                  {popularContent.map((item) => (
                    <div key={item.id} className=\"flex items-start space-x-3\">
                      <div className=\"flex-1\">
                        <h4 className=\"font-medium\">{item.title}</h4>
                        <p className=\"text-sm text-gray-600 mt-1\">{item.summary}</p>
                        <div className=\"flex items-center mt-2 space-x-2\">
                          <Badge variant=\"secondary\">{item.category}</Badge>
                          <div className=\"flex items-center text-sm text-gray-500\">
                            <TrendingUp className=\"h-3 w-3 mr-1\" />
                            {item.viewCount} 次浏览
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent History */}
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center\">
                <Clock className=\"h-5 w-5 mr-2 text-gray-500\" />
                最近浏览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"space-y-3\">
                {userHistory.map((item) => (
                  <div key={item.id} className=\"flex items-center justify-between\">
                    <div>
                      <p className=\"font-medium\">{item.interactionType} - {item.contentType}</p>
                      <p className=\"text-sm text-gray-600\">{item.searchQuery}</p>
                    </div>
                    <div className=\"text-sm text-gray-500\">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value=\"search\" className=\"space-y-6\">
          {searchResults ? (
            <div className=\"space-y-6\">
              <div className=\"flex items-center justify-between\">
                <h2 className=\"text-xl font-semibold\">搜索结果: \"{searchQuery}\"</h2>
                <Badge variant=\"outline\">
                  共找到 {
                    searchResults.guidelines.length + 
                    searchResults.drugInteractions.length + 
                    searchResults.clinicalTrials.length + 
                    searchResults.articles.length
                  } 条结果
                </Badge>
              </div>

              <Tabs defaultValue=\"all\" className=\"w-full\">
                <TabsList>
                  <TabsTrigger value=\"all\">全部</TabsTrigger>
                  <TabsTrigger value=\"guidelines\">指南 ({searchResults.guidelines.length})</TabsTrigger>
                  <TabsTrigger value=\"interactions\">药物交互 ({searchResults.drugInteractions.length})</TabsTrigger>
                  <TabsTrigger value=\"trials\">临床试验 ({searchResults.clinicalTrials.length})</TabsTrigger>
                  <TabsTrigger value=\"articles\">文章 ({searchResults.articles.length})</TabsTrigger>
                </TabsList>

                <TabsContent value=\"all\" className=\"space-y-4\">
                  {searchResults.guidelines.map((item) => (
                    <ContentCard key={`guideline-${item.id}`} item={item} type=\"nccn_guideline\" />
                  ))}
                  {searchResults.drugInteractions.map((item) => (
                    <ContentCard key={`interaction-${item.id}`} item={item} type=\"drug_interaction\" />
                  ))}
                  {searchResults.clinicalTrials.map((item) => (
                    <ContentCard key={`trial-${item.id}`} item={item} type=\"clinical_trial\" />
                  ))}
                  {searchResults.articles.map((item) => (
                    <ContentCard key={`article-${item.id}`} item={item} type=\"knowledge_article\" />
                  ))}
                </TabsContent>

                <TabsContent value=\"guidelines\" className=\"space-y-4\">
                  {searchResults.guidelines.map((item) => (
                    <ContentCard key={item.id} item={item} type=\"nccn_guideline\" />
                  ))}
                </TabsContent>

                <TabsContent value=\"interactions\" className=\"space-y-4\">
                  {searchResults.drugInteractions.map((item) => (
                    <ContentCard key={item.id} item={item} type=\"drug_interaction\" />
                  ))}
                </TabsContent>

                <TabsContent value=\"trials\" className=\"space-y-4\">
                  {searchResults.clinicalTrials.map((item) => (
                    <ContentCard key={item.id} item={item} type=\"clinical_trial\" />
                  ))}
                </TabsContent>

                <TabsContent value=\"articles\" className=\"space-y-4\">
                  {searchResults.articles.map((item) => (
                    <ContentCard key={item.id} item={item} type=\"knowledge_article\" />
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Alert>
              <Search className=\"h-4 w-4\" />
              <AlertDescription>
                在上方搜索框中输入关键词来搜索医疗知识库内容
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value=\"guidelines\" className=\"space-y-4\">
          <div className=\"text-center py-8\">
            <BookOpen className=\"h-16 w-16 mx-auto text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-semibold mb-2\">NCCN指南</h3>
            <p className=\"text-gray-600 mb-4\">浏览最新的NCCN癌症治疗指南</p>
            <Button>浏览指南</Button>
          </div>
        </TabsContent>

        <TabsContent value=\"trials\" className=\"space-y-4\">
          <div className=\"text-center py-8\">
            <Flask className=\"h-16 w-16 mx-auto text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-semibold mb-2\">临床试验</h3>
            <p className=\"text-gray-600 mb-4\">查找相关的临床试验信息</p>
            <Button>搜索试验</Button>
          </div>
        </TabsContent>

        <TabsContent value=\"articles\" className=\"space-y-4\">
          <div className=\"text-center py-8\">
            <FileText className=\"h-16 w-16 mx-auto text-gray-400 mb-4\" />
            <h3 className=\"text-lg font-semibold mb-2\">知识文章</h3>
            <p className=\"text-gray-600 mb-4\">阅读专业的医疗知识文章</p>
            <Button>浏览文章</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}