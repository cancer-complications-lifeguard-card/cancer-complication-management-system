'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/lib/db/schema';
import { medicalConfig } from '@/lib/config';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => Promise<void>;
  disabled?: boolean;
}

const roleConfig = {
  [UserRole.PATIENT]: {
    title: medicalConfig.userRoles.patient,
    description: '患者本人，可以完整使用所有医疗功能',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '👤'
  },
  [UserRole.FAMILY]: {
    title: medicalConfig.userRoles.family,
    description: '患者家属，协助患者进行健康管理',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '👨‍👩‍👧‍👦'
  },
  [UserRole.CAREGIVER]: {
    title: medicalConfig.userRoles.caregiver,
    description: '专业护理人员，提供专业护理指导',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: '👩‍⚕️'
  }
};

export function RoleSelector({ currentRole, onRoleChange, disabled = false }: RoleSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async (role: UserRole) => {
    if (role === currentRole || disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onRoleChange(role);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>用户身份</span>
          <Badge variant="secondary" className={roleConfig[currentRole].color}>
            {roleConfig[currentRole].icon} {roleConfig[currentRole].title}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {Object.entries(roleConfig).map(([role, config]) => {
            const roleEnum = role as UserRole;
            const isActive = roleEnum === currentRole;
            
            return (
              <Button
                key={role}
                variant={isActive ? "default" : "outline"}
                className={`justify-start p-4 h-auto ${isActive ? config.color : ''}`}
                onClick={() => handleRoleChange(roleEnum)}
                disabled={disabled || isLoading}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-lg">{config.icon}</span>
                    {config.title}
                    {isActive && <Badge variant="secondary" size="sm">当前</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}