""import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Shield, 
  Phone, 
  Clock,
  BookOpen,
  Stethoscope,
  Activity,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
  FileText,
  Pill,
  Calendar
} from 'lucide-react';

export default function CancerCareGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <Heart className="h-12 w-12 mr-4" />
            <div>
              <h1 className="text-3xl font-bold">癌症护理指南</h1>
              <p className="text-blue-100 mt-2">
                全面的癌症护理知识与日常管理指导
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Quick Access Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-500" />
            紧急情况处理
          </h2>
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              遇到紧急情况时，请立即采取以下行动。记住：生命第一，迅速求救！
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              asChild 
              className="w-full h-16 text-lg bg-red-600 hover:bg-red-700"
            >
              <a href="tel:120">
                <Phone className="h-6 w-6 mr-2" />
                拨打120急救
              </a>
            </Button>
            
            <Button 
              asChild 
              className="w-full h-16 text-lg"
              variant="default"
            >
              <a href="/dashboard/emergency">
                <Shield className="h-6 w-6 mr-2" />
                急救小红卡
              </a>
            </Button>
            
            <Button 
              asChild 
              className="w-full h-16 text-lg"
              variant="outline"
            >
              <a href="/dashboard/health">
                <Activity className="h-6 w-6 mr-2" />
                查看健康档案
              </a>
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Care Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                日常护理指导
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-800">饮食营养</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 选择高蛋白、营养丰富的食物</li>
                    <li>• 少食多餐，避免辛辣刺激食物</li>
                    <li>• 保持充足水分摄入</li>
                    <li>• 根据治疗反应调整饮食</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800">运动康复</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 适度的有氧运动（如散步）</li>
                    <li>• 避免剧烈运动和过度疲劳</li>
                    <li>• 根据体力状况调整运动强度</li>
                    <li>• 康复训练要循序渐进</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800">心理调适</h4>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• 保持积极乐观的心态</li>
                    <li>• 与家人朋友多沟通交流</li>
                    <li>• 参加支持小组活动</li>
                    <li>• 必要时寻求专业心理帮助</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medication Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-600" />
                用药安全指导
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-yellow-200 bg-yellow-50">
                  <Info className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    严格按医嘱用药，切勿自行调整剂量或停药
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">按时按量服药</div>
                      <div className="text-sm text-gray-600">
                        设置用药提醒，确保不遗漏任何一次用药
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">记录药物反应</div>
                      <div className="text-sm text-gray-600">
                        详细记录用药后的身体反应和副作用
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">避免药物相互作用</div>
                      <div className="text-sm text-gray-600">
                        告知医生所有正在使用的药物和保健品
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">妥善保存药物</div>
                      <div className="text-sm text-gray-600">
                        按照说明书要求储存，避免过期变质
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Signs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                紧急症状识别
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    出现以下症状时请立即就医或拨打120
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  {[
                    { symptom: "高热不退", detail: "体温超过38.5°C且持续不降" },
                    { symptom: "呼吸困难", detail: "胸闷、气促、呼吸急促" },
                    { symptom: "剧烈疼痛", detail: "难以忍受的疼痛，止痛药无效" },
                    { symptom: "意识改变", detail: "嗜睡、意识模糊、昏迷" },
                    { symptom: "大量出血", detail: "消化道出血、咳血等" },
                    { symptom: "严重感染", detail: "发热、寒颤、脓性分泌物" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-red-900">{item.symptom}</div>
                        <div className="text-sm text-red-700">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                支持资源
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <a href="/dashboard/knowledge">
                      <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">知识图谱</div>
                        <div className="text-sm text-gray-600">医疗术语和并发症指导</div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <a href="/dashboard/resources">
                      <Stethoscope className="h-5 w-5 mr-3 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">医疗资源</div>
                        <div className="text-sm text-gray-600">医院信息和专家门诊</div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <a href="/dashboard/triage">
                      <Activity className="h-5 w-5 mr-3 text-orange-600" />
                      <div className="text-left">
                        <div className="font-medium">智能分诊</div>
                        <div className="text-sm text-gray-600">症状评估和建议</div>
                      </div>
                    </a>
                  </Button>
                  
                  <Button asChild variant="outline" className="justify-start h-auto p-4">
                    <a href="/dashboard/monitoring">
                      <Clock className="h-5 w-5 mr-3 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">监测管理</div>
                        <div className="text-sm text-gray-600">生命体征和用药监测</div>
                      </div>
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                重要提醒
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 space-y-2">
                <p>• 本指南仅供参考，不能替代医生的专业建议</p>
                <p>• 治疗期间请定期复诊，遵循医生的治疗方案</p>
                <p>• 如有紧急情况，请立即联系医疗机构</p>
                <p>• 保持积极心态，配合治疗，相信医疗团队</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-green-600" />
                紧急联系方式
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-medium text-red-900">急救电话</span>
                  <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                    <a href="tel:120">120</a>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-900">医疗咨询</span>
                  <Button asChild size="sm" variant="outline">
                    <a href="tel:12320">12320</a>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-900">心理支持</span>
                  <Button asChild size="sm" variant="outline">
                    <a href="tel:400-161-9995">咨询热线</a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground border-t pt-6">
          <p>癌症并发症智能管理系统 - 专业的癌症护理指导平台</p>
          <p className="mt-1">为患者和家属提供全方位的医疗支持服务</p>
        </div>
      </div>
    </div>
  );
}