'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText,
  Award,
  TrendingUp,
  Users,
  Settings,
  Download
} from 'lucide-react';

interface ComplianceStandard {
  id: string;
  name: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'pending_review';
  progress: number;
  lastAssessment: string;
  nextReview: string;
  requirements: number;
  implementedRequirements: number;
}

interface RiskFactor {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

interface Certification {
  standard: string;
  status: 'certified' | 'in_progress' | 'expired' | 'not_applicable';
  expiryDate?: string;
  certificateNumber?: string;
}

interface ComplianceMetrics {
  overallScore: number;
  standardsCount: number;
  compliantStandards: number;
  highPriorityActions: number;
  upcomingReviews: number;
}

export function MedicalAIComplianceDashboard() {
  const [standards, setStandards] = useState<ComplianceStandard[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComplianceData();
    // Set up periodic updates
    const interval = setInterval(loadComplianceData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      // Load compliance standards
      const standardsResponse = await fetch('/api/compliance/standards');
      const standardsData = await standardsResponse.json();
      if (standardsData.success) {
        setStandards(standardsData.data);
      }
      
      // Load risk factors
      const risksResponse = await fetch('/api/compliance/risks');
      const risksData = await risksResponse.json();
      if (risksData.success) {
        setRiskFactors(risksData.data);
      }
      
      // Load certifications
      const certificationsResponse = await fetch('/api/compliance/certifications');
      const certificationsData = await certificationsResponse.json();
      if (certificationsData.success) {
        setCertifications(certificationsData.data);
      }
      
      // Load metrics
      const metricsResponse = await fetch('/api/compliance/metrics');
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.data);
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateComplianceReport = async () => {
    try {
      const response = await fetch('/api/compliance/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: 'periodic_review' }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600';
      case 'certified': return 'text-green-600';
      case 'partially_compliant': return 'text-yellow-600';
      case 'in_progress': return 'text-blue-600';
      case 'non_compliant': return 'text-red-600';
      case 'expired': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant': return 'default';
      case 'certified': return 'default';
      case 'partially_compliant': return 'secondary';
      case 'in_progress': return 'secondary';
      case 'non_compliant': return 'destructive';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading && !standards.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading compliance dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">医疗AI合规管理</h2>
          <p className="text-muted-foreground">
            确保系统符合医疗AI应用质量评价标准
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadComplianceData} disabled={loading} variant="outline">
            <Shield className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button onClick={generateComplianceReport}>
            <Download className="h-4 w-4 mr-2" />
            生成报告
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总体合规分数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics.overallScore}%</div>
              <Progress value={metrics.overallScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">合规标准</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.compliantStandards}/{metrics.standardsCount}</div>
              <p className="text-xs text-muted-foreground">
                已达标/总数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高优先级行动</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.highPriorityActions}</div>
              <p className="text-xs text-muted-foreground">
                待处理项目
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">即将到期审查</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.upcomingReviews}</div>
              <p className="text-xs text-muted-foreground">
                30天内
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">认证状态</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {certifications.filter(c => c.status === 'certified').length}
              </div>
              <p className="text-xs text-muted-foreground">
                有效认证
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="standards">合规标准</TabsTrigger>
          <TabsTrigger value="risks">风险评估</TabsTrigger>
          <TabsTrigger value="certifications">认证管理</TabsTrigger>
          <TabsTrigger value="actions">待办事项</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle>合规状态概览</CardTitle>
                <CardDescription>各类合规标准的实施情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['safety', 'privacy', 'accuracy', 'transparency'].map((category) => {
                  const categoryStandards = standards.filter(s => s.category === category);
                  const categoryProgress = categoryStandards.length > 0
                    ? categoryStandards.reduce((sum, s) => sum + s.progress, 0) / categoryStandards.length
                    : 0;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">
                          {category === 'safety' ? '安全性' :
                           category === 'privacy' ? '隐私保护' :
                           category === 'accuracy' ? '准确性' : '透明度'}
                        </span>
                        <span className="text-sm text-muted-foreground">{Math.round(categoryProgress)}%</span>
                      </div>
                      <Progress value={categoryProgress} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>最新活动</CardTitle>
                <CardDescription>近期合规相关活动和更新</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">ISO 27001认证更新</p>
                      <p className="text-xs text-muted-foreground">2小时前</p>
                    </div>
                    <Badge variant="default">完成</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI算法准确性测试</p>
                      <p className="text-xs text-muted-foreground">1天前</p>
                    </div>
                    <Badge variant="secondary">进行中</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">隐私政策更新需要</p>
                      <p className="text-xs text-muted-foreground">3天前</p>
                    </div>
                    <Badge variant="destructive">待处理</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Standards Tab */}
        <TabsContent value="standards" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {standards.map((standard) => (
              <Card key={standard.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{standard.name}</CardTitle>
                    <Badge variant={getStatusBadge(standard.status)}>
                      {standard.status === 'compliant' ? '达标' :
                       standard.status === 'partially_compliant' ? '部分达标' :
                       standard.status === 'non_compliant' ? '未达标' : '审查中'}
                    </Badge>
                  </div>
                  <CardDescription>
                    类别: {
                      standard.category === 'safety' ? '安全性' :
                      standard.category === 'privacy' ? '隐私保护' :
                      standard.category === 'accuracy' ? '准确性' : 
                      standard.category === 'transparency' ? '透明度' : '验证'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>完成进度</span>
                      <span>{Math.round(standard.progress)}%</span>
                    </div>
                    <Progress value={standard.progress} />
                  </div>

                  {/* Requirements */}
                  <div className="text-sm text-muted-foreground">
                    已实施需求: {standard.implementedRequirements}/{standard.requirements}
                  </div>

                  {/* Dates */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>上次评估: {new Date(standard.lastAssessment).toLocaleDateString()}</p>
                    <p>下次审查: {new Date(standard.nextReview).toLocaleDateString()}</p>
                  </div>

                  <Button size="sm" variant="outline" className="w-full">
                    查看详情
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <div className="space-y-3">
            {riskFactors.map((risk) => (
              <Alert key={risk.id}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{risk.category}</Badge>
                        <Badge 
                          variant={risk.severity === 'critical' || risk.severity === 'high' ? 'destructive' : 'secondary'}
                        >
                          {risk.severity === 'critical' ? '严重' :
                           risk.severity === 'high' ? '高' :
                           risk.severity === 'medium' ? '中' : '低'}
                        </Badge>
                      </div>
                      <p className="font-medium mb-1">{risk.description}</p>
                      <p className="text-sm text-muted-foreground">
                        状态: {risk.status}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      查看详情
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{cert.standard}</CardTitle>
                    <Badge variant={getStatusBadge(cert.status)}>
                      {cert.status === 'certified' ? '已认证' :
                       cert.status === 'in_progress' ? '进行中' :
                       cert.status === 'expired' ? '已过期' : '不适用'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {cert.certificateNumber && (
                    <p className="text-sm mb-2">
                      <strong>证书编号:</strong> {cert.certificateNumber}
                    </p>
                  )}
                  {cert.expiryDate && (
                    <p className="text-sm text-muted-foreground">
                      <strong>有效期至:</strong> {new Date(cert.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>待办事项</CardTitle>
              <CardDescription>需要完成的合规相关任务</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">更新隐私政策文档</p>
                    <p className="text-sm text-muted-foreground">截止日期: 7天后</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">高优先级</Badge>
                    <Button size="sm">标记完成</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">进行安全渗透测试</p>
                    <p className="text-sm text-muted-foreground">截止日期: 30天后</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">高优先级</Badge>
                    <Button size="sm">标记完成</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">申请医疗器械认证</p>
                    <p className="text-sm text-muted-foreground">截止日期: 90天后</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">中优先级</Badge>
                    <Button size="sm" variant="outline">查看详情</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}