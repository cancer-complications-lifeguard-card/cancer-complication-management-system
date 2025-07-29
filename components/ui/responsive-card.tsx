'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface ResponsiveCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  compact?: boolean;
}

export function ResponsiveCard({
  title,
  description,
  icon,
  badge,
  children,
  className,
  headerClassName,
  contentClassName,
  compact = false
}: ResponsiveCardProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className={cn(
        compact ? "pb-3" : "pb-4",
        "space-y-1 sm:space-y-2",
        headerClassName
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center gap-2",
            compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
          )}>
            {icon}
            <span className="truncate">{title}</span>
          </CardTitle>
          {badge && (
            <div className="flex-shrink-0">
              {badge}
            </div>
          )}
        </div>
        {description && (
          <CardDescription className={cn(
            "text-sm sm:text-base",
            compact && "text-xs sm:text-sm"
          )}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={cn(
        compact ? "pt-0" : "pt-2",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  );
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 }
}: ResponsiveGridProps) {
  const gridClasses = [];
  
  if (cols.default) gridClasses.push(`grid-cols-${cols.default}`);
  if (cols.sm) gridClasses.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) gridClasses.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) gridClasses.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) gridClasses.push(`xl:grid-cols-${cols.xl}`);
  
  return (
    <div className={cn(
      "grid gap-4 sm:gap-6",
      gridClasses.join(" "),
      className
    )}>
      {children}
    </div>
  );
}

interface MobileOptimizedTabsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOptimizedTabs({ children, className }: MobileOptimizedTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
}