"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Eye, Type, Palette } from 'lucide-react';

interface AccessibilitySettings {
  simplifiedMode: boolean;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

const AccessibilityContext = createContext<{
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  toggleSimplifiedMode: () => void;
}>({
  settings: {
    simplifiedMode: false,
    largeText: false,
    highContrast: false,
    reducedMotion: false,
  },
  updateSetting: () => {},
  toggleSimplifiedMode: () => {},
});

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    simplifiedMode: false,
    largeText: false,
    highContrast: false,
    reducedMotion: false,
  });

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
    
    // Check for system preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      setSettings(prev => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    
    // Apply CSS classes to document
    const root = document.documentElement;
    
    if (settings.simplifiedMode) {
      root.classList.add('simplified-ui');
    } else {
      root.classList.remove('simplified-ui');
    }
    
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }, [settings]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSimplifiedMode = () => {
    setSettings(prev => ({ ...prev, simplifiedMode: !prev.simplifiedMode }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, toggleSimplifiedMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function AccessibilityControls() {
  const { settings, updateSetting, toggleSimplifiedMode } = useAccessibility();

  return (
    <div className="accessibility-controls p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2" />
        辅助功能设置
      </h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            <span>简化界面模式</span>
          </div>
          <Button
            variant={settings.simplifiedMode ? "default" : "outline"}
            size="sm"
            onClick={toggleSimplifiedMode}
            className="min-h-[44px] min-w-[44px]"
          >
            {settings.simplifiedMode ? '已启用' : '启用'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Type className="h-4 w-4 mr-2" />
            <span>大字体模式</span>
          </div>
          <Button
            variant={settings.largeText ? "default" : "outline"}
            size="sm"
            onClick={() => updateSetting('largeText', !settings.largeText)}
            className="min-h-[44px] min-w-[44px]"
          >
            {settings.largeText ? '已启用' : '启用'}
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            <span>高对比度</span>
          </div>
          <Button
            variant={settings.highContrast ? "default" : "outline"}
            size="sm"
            onClick={() => updateSetting('highContrast', !settings.highContrast)}
            className="min-h-[44px] min-w-[44px]"
          >
            {settings.highContrast ? '已启用' : '启用'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simplified component wrapper
export function SimplifiedWrapper({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { settings } = useAccessibility();
  
  const simplifiedClasses = settings.simplifiedMode 
    ? "simplified-layout space-y-6 text-lg" 
    : "";
  
  return (
    <div className={`${simplifiedClasses} ${className}`}>
      {children}
    </div>
  );
}