import { Metadata } from 'next';
import { HospitalIntegrationDashboard } from './hospital-integration-client';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '医院系统集成 - 癌症并发症管理系统',
  description: '与外部医院系统集成，实现患者数据同步和医疗信息整合',
};

export default async function HospitalIntegrationPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <HospitalIntegrationDashboard user={session.user} />;
}