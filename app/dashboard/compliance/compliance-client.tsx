'use client';

import { User } from '@/lib/db/schema';
import { MedicalAIComplianceDashboard } from '@/components/compliance/medical-ai-compliance-dashboard';
import { AccessibilityProvider, SimplifiedWrapper } from '@/components/accessibility/simplified-ui';

interface ComplianceClientProps {
  user: User;
}

export function ComplianceClient({ user }: ComplianceClientProps) {
  return (
    <AccessibilityProvider>
      <SimplifiedWrapper>
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="mobile-heading-responsive font-bold text-foreground">
              医疗AI合规管理中心
            </h1>
            <p className="mobile-text-responsive text-muted-foreground max-w-2xl mx-auto">
              确保癌症并发症智能管理系统符合医疗AI应用质量评价标准
            </p>
          </div>

          <MedicalAIComplianceDashboard />
        </div>
      </SimplifiedWrapper>
    </AccessibilityProvider>
  );
}