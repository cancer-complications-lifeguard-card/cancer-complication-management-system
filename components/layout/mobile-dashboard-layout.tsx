'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileDashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  className?: string;
}

export function MobileDashboardLayout({
  children,
  title,
  subtitle,
  headerAction,
  className
}: MobileDashboardLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {(title || subtitle || headerAction) && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                {title && (
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              {headerAction && (
                <div className="flex-shrink-0">
                  {headerAction}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MobileStatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: MobileStatsCardProps) {
  return (
    <div className={cn(
      "bg-card border rounded-lg p-4 sm:p-6",
      "shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <p className="mt-1 text-lg sm:text-2xl lg:text-3xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {trend && (
            <div className={cn(
              "mt-2 inline-flex items-center text-xs sm:text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "↗" : "↘"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MobileActionCardProps {
  title: string;
  description: string;
  action: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function MobileActionCard({
  title,
  description,
  action,
  icon,
  className
}: MobileActionCardProps) {
  return (
    <div className={cn(
      "bg-card border rounded-lg p-4 sm:p-6",
      "shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              {icon}
            </div>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-medium text-foreground">
            {title}
          </h3>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            {description}
          </p>
          <div className="mt-3 sm:mt-4">
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}