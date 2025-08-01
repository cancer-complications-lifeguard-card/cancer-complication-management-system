'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  User, 
  BookOpen, 
  Heart, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Shield, 
  Database, 
  FlaskRound as Flask,
  Settings,
  Building2,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MobileNavItem {
  title: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  description?: string;
}

const navigationItems: MobileNavItem[] = [
  {
    title: '用户管理',
    href: '/dashboard/user-management',
    icon: User,
    description: '个人信息和权限设置'
  },
  {
    title: '知识图谱',
    href: '/dashboard/knowledge',
    icon: BookOpen,
    description: '医疗术语百科和并发症风险树'
  },
  {
    title: '健康档案',
    href: '/dashboard/health',
    icon: Heart,
    description: '病历和用药管理'
  },
  {
    title: '生命体征',
    href: '/dashboard/monitoring',
    icon: Activity,
    description: '实时监测数据'
  },
  {
    title: '智能分诊',
    href: '/dashboard/triage',
    icon: AlertTriangle,
    description: '症状分析和预警'
  },
  {
    title: '医疗导航',
    href: '/dashboard/resources',
    icon: MapPin,
    description: '医院和专家信息'
  },
  {
    title: '急救小红卡',
    href: '/dashboard/emergency',
    icon: Shield,
    badge: 'NEW',
    description: '紧急医疗信息卡'
  },
  {
    title: '医疗知识库',
    href: '/dashboard/knowledge-base',
    icon: Database,
    description: 'NCCN指南和文献'
  },
  {
    title: '药物交互',
    href: '/dashboard/drug-interactions',
    icon: Flask,
    description: '药物相互作用检查'
  },
  {
    title: '医院系统集成',
    href: '/dashboard/hospital',
    icon: Building2,
    badge: 'BETA',
    description: '外部医院系统连接'
  },
  {
    title: '安全监控',
    href: '/dashboard/security',
    icon: Settings,
    description: '隐私和安全设置'
  },
  {
    title: '合规管理',
    href: '/dashboard/compliance',
    icon: CheckCircle,
    badge: 'NEW',
    description: '医疗AI合规标准'
  }
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleItemClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden h-9 w-9 p-0"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">打开导航菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 px-0">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <SheetTitle className="text-lg font-semibold">功能导航</SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="flex flex-col p-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto p-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>癌症并发症智能管理系统</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}