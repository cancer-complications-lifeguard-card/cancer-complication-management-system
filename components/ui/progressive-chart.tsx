"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useScreenReader } from '@/components/accessibility/screen-reader-announcer';

interface ProgressiveChartProps {
  data: Array<{ time: string; value: number; [key: string]: any }>;
  title: string;
  unit?: string;
  color?: string;
  height?: number;
  isLoading?: boolean;
  loadingDelay?: number;
  chunkSize?: number;
}

export function ProgressiveChart({
  data = [],
  title,
  unit = '',
  color = '#8884d8',
  height = 300,
  isLoading = false,
  loadingDelay = 500,
  chunkSize = 10
}: ProgressiveChartProps) {
  const [displayedData, setDisplayedData] = useState<typeof data>([]);
  const [isProgressiveLoading, setIsProgressiveLoading] = useState(false);
  const { announceVitalSigns, component: screenReaderComponent } = useScreenReader();

  // Progressive data loading
  useEffect(() => {
    if (isLoading || data.length === 0) return;

    setIsProgressiveLoading(true);
    setDisplayedData([]);

    let currentIndex = 0;

    const loadNextChunk = () => {
      const nextChunk = data.slice(currentIndex, currentIndex + chunkSize);
      
      if (nextChunk.length > 0) {
        setDisplayedData(prev => [...prev, ...nextChunk]);
        currentIndex += chunkSize;

        // Continue loading if there's more data
        if (currentIndex < data.length) {
          setTimeout(loadNextChunk, 100); // 100ms delay between chunks
        } else {
          setIsProgressiveLoading(false);
          
          // Announce completion for screen readers
          const latestValue = data[data.length - 1];
          if (latestValue && title.includes('心率')) {
            // This is a heart rate chart
            announceVitalSigns(latestValue.value, '120/80', 36.5);
          }
        }
      } else {
        setIsProgressiveLoading(false);
      }
    };

    // Start loading after initial delay
    setTimeout(loadNextChunk, loadingDelay);
  }, [data, isLoading, chunkSize, loadingDelay, announceVitalSigns, title]);

  // Calculate chart statistics
  const chartStats = useMemo(() => {
    if (displayedData.length === 0) return null;
    
    const values = displayedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1),
      latest: latest.toFixed(1),
      trend: latest > avg ? 'up' : latest < avg ? 'down' : 'stable'
    };
  }, [displayedData]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className={`w-full`} style={{ height }} />
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="progressive-chart-container">
      {screenReaderComponent}
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold" id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}>
          {title}
        </h3>
        {isProgressiveLoading && (
          <div className="text-sm text-muted-foreground mt-2">
            正在加载图表数据... ({displayedData.length}/{data.length})
          </div>
        )}
      </div>

      <div 
        className="chart-container" 
        style={{ height }}
        role="img" 
        aria-labelledby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}`}
        aria-describedby={`chart-${title.replace(/\s+/g, '-').toLowerCase()}-desc`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: color, strokeWidth: 1 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              axisLine={{ stroke: color, strokeWidth: 1 }}
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number) => [`${value}${unit}`, title]}
              labelFormatter={(time) => `时间: ${time}`}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5, fill: color }}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible chart description */}
      <div 
        id={`chart-${title.replace(/\s+/g, '-').toLowerCase()}-desc`}
        className="sr-only"
      >
        {chartStats && (
          `${title}图表显示了${displayedData.length}个数据点。当前值：${chartStats.latest}${unit}，平均值：${chartStats.avg}${unit}，最高值：${chartStats.max}${unit}，最低值：${chartStats.min}${unit}。趋势：${chartStats.trend === 'up' ? '上升' : chartStats.trend === 'down' ? '下降' : '平稳'}。`
        )}
      </div>

      {/* Chart statistics */}
      {chartStats && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">当前值</div>
            <div className="font-semibold text-lg">{chartStats.latest}{unit}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">平均值</div>
            <div className="font-semibold">{chartStats.avg}{unit}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">最高值</div>
            <div className="font-semibold">{chartStats.max}{unit}</div>
          </div>
          <div className="bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground">最低值</div>
            <div className="font-semibold">{chartStats.min}{unit}</div>
          </div>
        </div>
      )}
      
      {isProgressiveLoading && (
        <div className="mt-2 w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(displayedData.length / data.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}