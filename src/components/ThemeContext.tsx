/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColor, AppMode, UserSettings } from '../types';
import { loadFromStorage, saveToStorage, DEFAULT_SETTINGS } from '../data';

interface ThemeContextType {
  themeColor: ThemeColor;
  appMode: AppMode;
  companyBranding: boolean;
  setThemeColor: (color: ThemeColor) => void;
  setAppMode: (mode: AppMode) => void;
  setCompanyBranding: (branding: boolean) => void;
  // Dynamic color getters for Tailwind
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryBorder: string;
  primaryRing: string;
  primaryLightBg: string;
  badgeBg: string;
  badgeText: string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(() => 
    loadFromStorage<UserSettings>('settings', DEFAULT_SETTINGS)
  );

  useEffect(() => {
    saveToStorage('settings', settings);
    // Apply dark mode class to HTML element
    if (settings.appMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const setThemeColor = (themeColor: ThemeColor) => {
    setSettings(prev => ({ ...prev, themeColor }));
  };

  const setAppMode = (appMode: AppMode) => {
    setSettings(prev => ({ ...prev, appMode }));
  };

  const setCompanyBranding = (companyBranding: boolean) => {
    setSettings(prev => ({ ...prev, companyBranding }));
  };

  // Map theme values to Tailwind CSS class strings
  let primaryBg = 'bg-[#1E88E5]';
  let primaryHoverBg = 'hover:bg-[#1565C0]';
  let primaryText = 'text-[#1E88E5] dark:text-[#64B5F6]';
  let primaryBorder = 'border-[#1E88E5]';
  let primaryRing = 'focus:ring-[#1E88E5]';
  let primaryLightBg = 'bg-[#1E88E5]/5 dark:bg-[#1E88E5]/10';
  let badgeBg = 'bg-[#1E88E5]/10 dark:bg-[#1E88E5]/25';
  let badgeText = 'text-[#1565C0] dark:text-[#64B5F6]';

  if (settings.themeColor === 'green') {
    primaryBg = 'bg-emerald-600';
    primaryHoverBg = 'hover:bg-emerald-700';
    primaryText = 'text-emerald-600 dark:text-emerald-400';
    primaryBorder = 'border-emerald-500';
    primaryRing = 'focus:ring-emerald-500';
    primaryLightBg = 'bg-emerald-50 dark:bg-emerald-950/40';
    badgeBg = 'bg-emerald-100 dark:bg-emerald-900/30';
    badgeText = 'text-emerald-700 dark:text-emerald-300';
  } else if (settings.themeColor === 'purple') {
    primaryBg = 'bg-violet-600';
    primaryHoverBg = 'hover:bg-violet-700';
    primaryText = 'text-violet-600 dark:text-violet-400';
    primaryBorder = 'border-violet-500';
    primaryRing = 'focus:ring-violet-500';
    primaryLightBg = 'bg-violet-50 dark:bg-violet-950/40';
    badgeBg = 'bg-violet-100 dark:bg-violet-900/30';
    badgeText = 'text-violet-700 dark:text-violet-300';
  } else if (settings.themeColor === 'amber') {
    primaryBg = 'bg-amber-600';
    primaryHoverBg = 'hover:bg-amber-700';
    primaryText = 'text-amber-600 dark:text-amber-400';
    primaryBorder = 'border-amber-500';
    primaryRing = 'focus:ring-amber-500';
    primaryLightBg = 'bg-amber-50 dark:bg-amber-950/40';
    badgeBg = 'bg-amber-100 dark:bg-amber-900/30';
    badgeText = 'text-amber-700 dark:text-amber-300';
  }

  return (
    <ThemeContext.Provider value={{
      themeColor: settings.themeColor,
      appMode: settings.appMode,
      companyBranding: settings.companyBranding,
      setThemeColor,
      setAppMode,
      setCompanyBranding,
      primaryBg,
      primaryHoverBg,
      primaryText,
      primaryBorder,
      primaryRing,
      primaryLightBg,
      badgeBg,
      badgeText
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
