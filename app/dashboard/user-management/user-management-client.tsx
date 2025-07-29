'use client';

import { useState, useEffect } from 'react';
import { User, UserRole, UserStage, MedicalProfile, NewMedicalProfile } from '@/lib/db/schema';
import { StageSelector } from '@/components/medical/stage-selector';
import { RoleSelector } from '@/components/medical/role-selector';
import { MedicalProfileForm } from '@/components/medical/medical-profile-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

interface UserManagementClientProps {
  user: User;
}

export function UserManagementClient({ user: initialUser }: UserManagementClientProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [medicalProfile, setMedicalProfile] = useState<MedicalProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const router = useRouter();

  // 加载医疗档案
  useEffect(() => {
    loadMedicalProfile();
  }, []);

  const loadMedicalProfile = async () => {
    try {
      const response = await fetch('/api/medical-profile');
      const data = await response.json();
      
      if (data.success) {
        setMedicalProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading medical profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleStageChange = async (stage: UserStage) => {
    try {
      const response = await fetch('/api/user/stage', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stage }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        router.refresh(); // 刷新页面数据
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating stage:', error);
      alert('更新状态失败，请重试');
    }
  };

  const handleRoleChange = async (role: UserRole) => {
    try {
      const response = await fetch('/api/user/role', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        router.refresh(); // 刷新页面数据
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('更新角色失败，请重试');
    }
  };

  const handleProfileSubmit = async (profileData: Partial<NewMedicalProfile>) => {
    try {
      const method = medicalProfile ? 'PATCH' : 'POST';
      const response = await fetch('/api/medical-profile', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      
      if (data.success) {
        setMedicalProfile(data.profile);
        setShowProfileForm(false);
        alert(medicalProfile ? '医疗档案更新成功！' : '医疗档案创建成功！');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error saving medical profile:', error);
      alert('保存医疗档案失败，请重试');
    }
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="stage">状态管理</TabsTrigger>
        <TabsTrigger value="role">身份管理</TabsTrigger>
        <TabsTrigger value="profile">医疗档案</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>姓名:</strong> {user.name || '未设置'}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>注册时间:</strong> {new Date(user.createdAt).toLocaleDateString('zh-CN')}</p>
                <p><strong>最后登录:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '未知'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>当前状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">用户身份:</span>
                  <Badge className="ml-2">
                    {user.role === 'patient' ? '患者' : 
                     user.role === 'family' ? '家属' : '护理人员'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">当前阶段:</span>
                  <Badge className="ml-2" variant="outline">
                    {user.currentStage === 'daily' ? '日常预防' : 
                     user.currentStage === 'inquiry' ? '症状查询' : '发病紧急处理'}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm text-gray-600">账户状态:</span>
                  <Badge className="ml-2" variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? '活跃' : '已停用'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>医疗档案状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoadingProfile ? (
                  <p className="text-sm text-gray-500">加载中...</p>
                ) : medicalProfile ? (
                  <div>
                    <Badge className="mb-2" variant="default">已创建</Badge>
                    <p className="text-sm text-gray-600">
                      创建时间: {new Date(medicalProfile.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                    <p className="text-sm text-gray-600">
                      最后更新: {new Date(medicalProfile.updatedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ) : (
                  <div>
                    <Badge variant="outline" className="mb-2">未创建</Badge>
                    <p className="text-sm text-gray-600">请创建您的医疗档案以获得更好的服务。</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="stage">
        <StageSelector 
          currentStage={user.currentStage as UserStage}
          onStageChange={handleStageChange}
        />
      </TabsContent>

      <TabsContent value="role">
        <RoleSelector 
          currentRole={user.role as UserRole}
          onRoleChange={handleRoleChange}
        />
      </TabsContent>

      <TabsContent value="profile" className="space-y-6">
        {showProfileForm ? (
          <MedicalProfileForm
            profile={medicalProfile}
            onSubmit={handleProfileSubmit}
            onCancel={() => setShowProfileForm(false)}
          />
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>医疗档案</CardTitle>
              <Button onClick={() => setShowProfileForm(true)}>
                {medicalProfile ? '编辑档案' : '创建档案'}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <p>加载中...</p>
              ) : medicalProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">癌症类型</h4>
                      <p className="text-gray-600">{medicalProfile.cancerType || '未填写'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">癌症分期</h4>
                      <p className="text-gray-600">{medicalProfile.cancerStage || '未填写'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">确诊日期</h4>
                      <p className="text-gray-600">
                        {medicalProfile.diagnosisDate ? new Date(medicalProfile.diagnosisDate).toLocaleDateString('zh-CN') : '未填写'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">主治医生</h4>
                      <p className="text-gray-600">{medicalProfile.doctorName || '未填写'}</p>
                    </div>
                  </div>
                  
                  {medicalProfile.treatmentPlan && (
                    <div>
                      <h4 className="font-medium text-gray-900">治疗方案</h4>
                      <p className="text-gray-600">{medicalProfile.treatmentPlan}</p>
                    </div>
                  )}
                  
                  {medicalProfile.allergies && (
                    <div>
                      <h4 className="font-medium text-gray-900">过敏史</h4>
                      <p className="text-gray-600">{medicalProfile.allergies}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">您还没有创建医疗档案</p>
                  <p className="text-sm text-gray-400">
                    创建医疗档案可以帮助系统为您提供更精准的医疗建议和服务
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}