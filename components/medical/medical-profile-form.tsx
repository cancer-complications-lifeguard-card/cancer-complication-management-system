'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MedicalProfile, NewMedicalProfile } from '@/lib/db/schema';

interface MedicalProfileFormProps {
  profile?: MedicalProfile | null;
  onSubmit: (data: Partial<NewMedicalProfile>) => Promise<void>;
  onCancel?: () => void;
}

interface FormData {
  cancerType: string;
  cancerStage: string;
  diagnosisDate: string;
  treatmentPlan: string;
  allergies: string;
  medicalHistory: string;
  doctorName: string;
  doctorContact: string;
  hospitalName: string;
  hospitalAddress: string;
}

export function MedicalProfileForm({ profile, onSubmit, onCancel }: MedicalProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      cancerType: profile?.cancerType || '',
      cancerStage: profile?.cancerStage || '',
      diagnosisDate: profile?.diagnosisDate ? profile.diagnosisDate.toString().split('T')[0] : '',
      treatmentPlan: profile?.treatmentPlan || '',
      allergies: profile?.allergies || '',
      medicalHistory: profile?.medicalHistory || '',
      doctorName: profile?.doctorName || '',
      doctorContact: profile?.doctorContact || '',
      hospitalName: profile?.hospitalName || '',
      hospitalAddress: profile?.hospitalAddress || '',
    }
  });

  const onSubmitForm = async (data: FormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        ...data,
        diagnosisDate: data.diagnosisDate ? new Date(data.diagnosisDate) : null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>
          {profile ? '编辑医疗档案' : '创建医疗档案'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cancerType">癌症类型</Label>
              <Input
                id="cancerType"
                {...register('cancerType')}
                placeholder="例：肺癌、乳腺癌等"
              />
            </div>
            <div>
              <Label htmlFor="cancerStage">癌症分期</Label>
              <Input
                id="cancerStage"
                {...register('cancerStage')}
                placeholder="例：I期、II期、III期、IV期"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="diagnosisDate">确诊日期</Label>
            <Input
              id="diagnosisDate"
              type="date"
              {...register('diagnosisDate')}
            />
          </div>

          {/* 治疗信息 */}
          <div>
            <Label htmlFor="treatmentPlan">治疗方案</Label>
            <Textarea
              id="treatmentPlan"
              {...register('treatmentPlan')}
              placeholder="详细描述当前的治疗方案，包括化疗、放疗、手术等"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="allergies">过敏史</Label>
            <Textarea
              id="allergies"
              {...register('allergies')}
              placeholder="列出所有已知的药物过敏和其他过敏史"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="medicalHistory">既往病史</Label>
            <Textarea
              id="medicalHistory"
              {...register('medicalHistory')}
              placeholder="详细描述相关的医疗病史"
              rows={3}
            />
          </div>

          {/* 医生信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doctorName">主治医生姓名</Label>
              <Input
                id="doctorName"
                {...register('doctorName')}
                placeholder="输入主治医生姓名"
              />
            </div>
            <div>
              <Label htmlFor="doctorContact">医生联系方式</Label>
              <Input
                id="doctorContact"
                {...register('doctorContact')}
                placeholder="手机号码或办公电话"
              />
            </div>
          </div>

          {/* 医院信息 */}
          <div>
            <Label htmlFor="hospitalName">医院名称</Label>
            <Input
              id="hospitalName"
              {...register('hospitalName')}
              placeholder="就诊医院全称"
            />
          </div>

          <div>
            <Label htmlFor="hospitalAddress">医院地址</Label>
            <Textarea
              id="hospitalAddress"
              {...register('hospitalAddress')}
              placeholder="医院详细地址"
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : (profile ? '更新档案' : '创建档案')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}