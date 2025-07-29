import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  WifiOff, 
  RefreshCw, 
  Heart, 
  Shield, 
  Phone, 
  AlertTriangle,
  Clock,
  Database
} from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">离线模式</h1>
          <p className="text-muted-foreground mt-2">
            您当前处于离线状态，但仍可访问部分功能
          </p>
        </div>

        {/* Status Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            网络连接不可用。某些功能可能受限，但缓存的数据仍可使用。
          </AlertDescription>
        </Alert>

        {/* Available Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              离线可用功能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-900">急救小红卡</div>
                  <div className="text-sm text-green-700">查看紧急医疗信息</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Heart className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">个人健康档案</div>
                  <div className="text-sm text-blue-700">查看缓存的医疗记录</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">用药提醒</div>
                  <div className="text-sm text-purple-700">查看药物信息</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Phone className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">紧急呼叫</div>
                  <div className="text-sm text-red-700">拨打120和联系人</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button 
                asChild 
                className="w-full h-12 text-base"
                variant="default"
              >
                <a href="/dashboard/emergency">
                  <Shield className="h-5 w-5 mr-2" />
                  急救小红卡
                </a>
              </Button>
              
              <Button 
                asChild 
                className="w-full h-12 text-base"
                variant="outline"
              >
                <a href="/dashboard/health">
                  <Heart className="h-5 w-5 mr-2" />
                  健康档案
                </a>
              </Button>
              
              <Button 
                asChild 
                className="w-full h-12 text-base bg-red-600 hover:bg-red-700"
              >
                <a href="tel:120">
                  <Phone className="h-5 w-5 mr-2" />
                  呼叫120
                </a>
              </Button>
              
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full h-12 text-base"
                variant="secondary"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                重新连接
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card>
          <CardHeader>
            <CardTitle>离线使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">紧急功能保持可用</div>
                  <div className="text-sm text-muted-foreground">
                    急救卡信息、紧急联系人和120呼叫功能完全可用
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">缓存数据可查看</div>
                  <div className="text-sm text-muted-foreground">
                    您可以查看之前加载的医疗记录、用药信息等
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="font-medium">数据同步</div>
                  <div className="text-sm text-muted-foreground">
                    网络恢复后，系统会自动同步您的离线操作
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          癌症并发症智能管理系统 - 离线模式
        </div>
      </div>
    </div>
  );
}