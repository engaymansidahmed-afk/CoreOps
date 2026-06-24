/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, EmployeeRole } from '../types';
import { INITIAL_EMPLOYEES } from '../data';
import { Shield, Hammer, Wallet, TrendingUp, RefreshCw, ChevronDown, ChevronUp, Info, Moon, Sun, Palette } from 'lucide-react';
import { useAppTheme } from './ThemeContext';

interface RoleSwitcherProps {
  currentRole: EmployeeRole;
  onRoleChange: (role: EmployeeRole) => void;
  employees: Employee[];
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  employees
}) => {
  const { themeColor, setThemeColor, appMode, setAppMode, primaryBg, primaryText } = useAppTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  const getRoleIcon = (role: EmployeeRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5" />;
      case 'engineer':
        return <Hammer className="w-5 h-5" />;
      case 'accountant':
        return <Wallet className="w-5 h-5" />;
      case 'sales':
        return <TrendingUp className="w-5 h-5" />;
    }
  };

  const getRoleLabel = (role: EmployeeRole) => {
    switch (role) {
      case 'admin':
        return '👑 الإدارة (Admin)';
      case 'engineer':
        return '👷 المهندس الميداني (Engineer)';
      case 'accountant':
        return '💰 المحاسب المالي (Accountant)';
      case 'sales':
        return '📢 مسؤل التسويق والمبيعات (Sales)';
    }
  };

  const getRoleDescription = (role: EmployeeRole) => {
    switch (role) {
      case 'admin':
        return 'مراقبة عامة، تعيين المهام، مراجعة المشاريع، اعتماد عهد الإدارة، والتقارير الشاملة.';
      case 'engineer':
        return 'استلام المهام والتشغيل، الحضور، رفع تقارير معاينة وإنجاز بالصور، وتوقيع العميل والعهد.';
      case 'accountant':
        return 'مراجعة طلبات العهد والتصفيات المالية، تصفية الفواتير للشركة والموظفين، وعرض الأرباح والخسائر.';
      case 'sales':
        return 'إضافة عملاء (Leads)، تحديد الموقع، إعداد العروض، وتحويل العميل لمهمة فورية للفني المختص.';
    }
  };

  const activeEmployee = employees.find(e => e.role === currentRole) || employees[0];

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl border-b border-slate-700 transition-all duration-300">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-900 p-1.5 rounded-lg animate-pulse">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg flex items-center gap-2 font-sans tracking-tight">
              <span>لوحة محاكاة النظام والتحكم</span>
              <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-amber-400 font-mono">CoreOps MVP</span>
            </h1>
            <p className="text-xs text-slate-300 hidden md:block">
              قم بتبديل الدور لتجربة دورة العمل المتكاملة للمقاولات ميدانياً ومالياً
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick theme toggles */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
            {/* Mode toggle */}
            <button
              onClick={() => setAppMode(appMode === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title={appMode === 'light' ? 'الوضع الداكن' : 'الوضع المضيء'}
            >
              {appMode === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Colors */}
            <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
            
            {(['blue', 'green', 'purple', 'amber'] as const).map(color => {
              const colorBg = 
                color === 'blue' ? 'bg-blue-500' :
                color === 'green' ? 'bg-emerald-500' :
                color === 'purple' ? 'bg-violet-500' : 'bg-amber-500';
              const isSelected = themeColor === color;
              return (
                <button
                  key={color}
                  onClick={() => setThemeColor(color)}
                  className={`w-4.5 h-4.5 rounded-full ${colorBg} border-2 ${isSelected ? 'border-white scale-125' : 'border-transparent hover:scale-110'} transition-all`}
                  title={`سمات اللون: ${color}`}
                />
              );
            })}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs border border-slate-700 transition-colors"
          >
            <span>{isExpanded ? 'إخفاء الدليل' : 'عرض الدليل'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded simulator controller */}
      {isExpanded && (
        <div className="bg-slate-800/80 border-t border-slate-700/60 p-4 transition-all">
          <div className="max-w-7xl mx-auto">
            {/* Guide Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 text-xs">
              <div className="flex gap-2.5">
                <span className="w-5 h-5 flex items-center justify-center bg-violet-600 text-white rounded-full font-bold">1</span>
                <div>
                  <h4 className="font-bold text-violet-400">قسم المبيعات (Sales)</h4>
                  <p className="text-slate-300">أضف عميل جديد بـ GPS وحدد الخدمة (مثلاً إنذار) ثم اضغط "إسناد للمهندس".</p>
                </div>
              </div>
              <div className="flex gap-2.5 border-t md:border-t-0 md:border-r border-slate-700/60 pt-2 md:pt-0 md:pr-3">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-500 text-white rounded-full font-bold">2</span>
                <div>
                  <h4 className="font-bold text-blue-400">الموظف الميداني (Engineer)</h4>
                  <p className="text-slate-300">سجل حضورك، اقبل المهمة، ارفع تقرير الإنجاز قبل/بعد، توقيع العميل واطلب عهدة مالية.</p>
                </div>
              </div>
              <div className="flex gap-2.5 border-t md:border-t-0 md:border-r border-slate-700/60 pt-2 md:pt-0 md:pr-3">
                <span className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-full font-bold">3</span>
                <div>
                  <h4 className="font-bold text-emerald-400">المحاسب المالي (Accountant)</h4>
                  <p className="text-slate-300">راجع العهد المطلوبة للفني، واعتمد تصفية الفواتير المرفوعة واحسب الفروقات المالية بدقة.</p>
                </div>
              </div>
              <div className="flex gap-2.5 border-t md:border-t-0 md:border-r border-slate-700/60 pt-2 md:pt-0 md:pr-3">
                <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-white rounded-full font-bold">4</span>
                <div>
                  <h4 className="font-bold text-amber-400">👑 لوحة الإدارة (Admin)</h4>
                  <p className="text-slate-300">تابع حركة المشاريع ونسب إنجاز المهام، عهد الموظفين، الحضور بالخريطة والتقارير الشاملة.</p>
                </div>
              </div>
            </div>

            {/* Switch Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                اختر الهوية الحالية للتنقل في شاشات التطبيق:
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1 md:flex-initial">
                {(['sales', 'engineer', 'accountant', 'admin'] as const).map(role => {
                  const isSelected = currentRole === role;
                  let btnColor = 'border-slate-600 text-slate-300 hover:bg-slate-700';
                  if (isSelected) {
                    if (role === 'admin') btnColor = 'bg-amber-600 text-slate-900 border-amber-400 font-bold';
                    else if (role === 'engineer') btnColor = 'bg-blue-600 text-white border-blue-400 font-bold';
                    else if (role === 'accountant') btnColor = 'bg-emerald-600 text-white border-emerald-400 font-bold';
                    else btnColor = 'bg-violet-600 text-white border-violet-400 font-bold';
                  }

                  return (
                    <button
                      key={role}
                      id={`btn-role-${role}`}
                      onClick={() => onRoleChange(role)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs text-center transition-all cursor-pointer ${btnColor}`}
                    >
                      {getRoleIcon(role)}
                      <span>{getRoleLabel(role).split(' ')[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active User Stats Info */}
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <img
                  src={activeEmployee.avatar}
                  alt={activeEmployee.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-600"
                  referrerPolicy="no-referrer"
                />
                <span className="text-slate-200 font-medium">{activeEmployee.name}</span>
                <span className="text-slate-500">|</span>
                <span>الرقم الوظيفي: <strong className="text-slate-300 font-mono">{activeEmployee.code}</strong></span>
                <span className="text-slate-500">|</span>
                <span>البريد الإلكتروني: <strong className="text-slate-300 font-mono">{activeEmployee.email}</strong></span>
              </div>
              <div className="hidden sm:block text-slate-400">
                <span className="bg-slate-900/60 px-2 py-1 rounded text-slate-300">
                  {getRoleDescription(currentRole)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
