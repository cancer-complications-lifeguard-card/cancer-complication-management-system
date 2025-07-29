'use client';

import { SecurityDashboard } from '@/components/security/security-dashboard';

interface SecurityDashboardClientProps {
  userId: number;
  userRole: string;
}

export function SecurityDashboardClient({ userId, userRole }: SecurityDashboardClientProps) {
  return <SecurityDashboard userId={userId} userRole={userRole} />;
}