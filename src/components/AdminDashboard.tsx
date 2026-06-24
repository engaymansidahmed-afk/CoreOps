/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Project, Employee, Task, CashAdvance, Asset, AttendanceLog, Lead, DailyReport, SecurityLog } from '../types';
import { StatusBadge, PriorityBadge, GPSMap } from './SharedComponents';
import { useAppTheme } from './ThemeContext';
import { Plus, Users, Briefcase, CheckSquare, Wallet, Calendar, MapPin, Search, AlertTriangle, TrendingUp, Compass, ChevronLeft, LayoutDashboard, Database, BarChart3, Clock, Check, X, Shield, Mail, Key, RefreshCw, Lock, Unlock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { hashPassword } from '../lib/crypto';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface AdminDashboardProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  advances: CashAdvance[];
  setAdvances: React.Dispatch<React.SetStateAction<CashAdvance[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  attendanceLogs: AttendanceLog[];
  leads: Lead[];
  dailyReports: DailyReport[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  securityLogs: SecurityLog[];
  onAddSecurityLog: (action: SecurityLog['action'], username: string, details: string, severity: SecurityLog['severity']) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  projects, setProjects,
  tasks, setTasks,
  advances, setAdvances,
  assets, setAssets,
  employees, setEmployees,
  attendanceLogs,
  leads,
  dailyReports,
  onShowToast,
  securityLogs,
  onAddSecurityLog
}) => {
  const { primaryBg, primaryText, primaryBorder, primaryLightBg, badgeBg, badgeText, appMode } = useAppTheme();
  
  // Tabs: dashboard, projects, tasks, advances, assets, attendance, reports, security
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'tasks' | 'advances' | 'assets' | 'attendance' | 'reports' | 'security'>('dashboard');
  
  // Security Log Filters
  const [logFilterAction, setLogFilterAction] = useState<string>('all');
  const [logFilterSeverity, setLogFilterSeverity] = useState<string>('all');
  const [secSubTab, setSecSubTab] = useState<'employees' | 'logs'>('employees');

  // New Employee Form State
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpCode, setNewEmpCode] = useState('');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpPhone, setNewEmpPhone] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<'engineer' | 'accountant' | 'sales'>('engineer');
  const [generatedCreds, setGeneratedCreds] = useState<{ name: string; code: string; email: string; tempPass: string } | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // New Project Form State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjType, setNewProjType] = useState<'alarm' | 'firefighting' | 'generators' | 'maintenance'>('alarm');
  const [newProjBudget, setNewProjBudget] = useState(50000);
  const [newProjClient, setNewProjClient] = useState('');

  // New Task Form State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskProjId, setNewTaskProjId] = useState('');
  const [newTaskEmpId, setNewTaskEmpId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // New Asset Form State
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState('');

  // Metrics calculation
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;
  const totalAdvancesApproved = advances
    .filter(a => a.status === 'approved' || a.status === 'cleared')
    .reduce((sum, a) => sum + a.amount, 0);
  const pendingAdvancesCount = advances.filter(a => a.status === 'pending_admin').length;
  const totalExpenses = advances.reduce((sum, a) => {
    if (a.status === 'cleared') {
      const clearanceSum = a.clearanceInvoices.reduce((s, i) => s + i.amount, 0);
      return sum + clearanceSum;
    }
    return sum;
  }, 0);

  // Helper to generate a random temporary password
  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = 'TMP-';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName || !newEmpCode || !newEmpEmail) {
      onShowToast('الرجاء إدخال اسم الموظف ورقمه الوظيفي وبريده الإلكتروني المعتمد', 'error');
      return;
    }

    const cleanCode = newEmpCode.trim();

    // Check if code already exists
    if (employees.some(emp => emp.code === cleanCode)) {
      onShowToast('❌ عذراً، هذا الرقم الوظيفي مسجل مسبقاً لموظف آخر في النظام', 'error');
      return;
    }

    // Check if email already exists
    if (employees.some(emp => emp.email.toLowerCase() === newEmpEmail.trim().toLowerCase())) {
      onShowToast('❌ عذراً، هذا البريد الإلكتروني مسجل مسبقاً لموظف آخر', 'error');
      return;
    }

    const tempPassword = generateTempPassword();

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      code: cleanCode,
      role: newEmpRole,
      email: newEmpEmail.trim(),
      phone: newEmpPhone.trim() || '+966 50 000 0000',
      passwordHash: hashPassword(tempPassword),
      mustChangePassword: true
    };

    setEmployees(prev => [...prev, newEmp]);
    setShowEmployeeModal(false);
    
    // Set generated credentials to show to admin (and log simulated email)
    setGeneratedCreds({
      name: newEmp.name,
      code: newEmp.code,
      email: newEmp.email,
      tempPass: tempPassword
    });

    onAddSecurityLog('password_reset', 'admin', `إضافة موظف جديد (${newEmp.name}) بالرقم الوظيفي (${cleanCode}) وإنشاء كلمة مرور مؤقتة`, 'medium');
    onShowToast(`✓ تم تسجيل الموظف "${newEmpName}" وتوليد كلمة مرور مؤقتة بنجاح`, 'success');

    // Reset inputs
    setNewEmpName('');
    setNewEmpCode('');
    setNewEmpEmail('');
    setNewEmpPhone('');
    setNewEmpRole('engineer');
  };

  const handleResetEmployeePassword = (emp: Employee) => {
    const tempPassword = generateTempPassword();

    setEmployees(prev => prev.map(e => {
      if (e.id === emp.id) {
        return {
          ...e,
          passwordHash: hashPassword(tempPassword),
          mustChangePassword: true
        };
      }
      return e;
    }));

    setGeneratedCreds({
      name: emp.name,
      code: emp.code,
      email: emp.email,
      tempPass: tempPassword
    });

    onAddSecurityLog('password_reset', 'admin', `تمت إعادة تعيين كلمة مرور الموظف (${emp.name}) وتوليد كلمة مرور مؤقتة جديدة`, 'high');
    onShowToast(`✓ تم تصفير كلمة مرور الموظف "${emp.name}" وتوليد كلمة مرور مؤقتة جديدة`, 'success');
  };

  // Handlers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjLocation || !newProjClient) {
      onShowToast('الرجاء إدخال جميع الحقول الأساسية لإنشاء المشروع', 'error');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjName,
      location: newProjLocation,
      latitude: 24.6 + (Math.random() * 0.2), // Random Riyadh area
      longitude: 46.6 + (Math.random() * 0.2),
      type: newProjType,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +6 months
      budget: Number(newProjBudget),
      clientName: newProjClient
    };

    setProjects(prev => [newProject, ...prev]);
    setShowProjectModal(false);
    onShowToast(`تم إنشاء مشروع "${newProjName}" بنجاح وتعيينه للموقع الجغرافي`, 'success');
    
    // Clear state
    setNewProjName('');
    setNewProjLocation('');
    setNewProjClient('');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskProjId || !newTaskEmpId) {
      onShowToast('الرجاء كتابة عنوان المهمة واختيار المشروع والموظف المسؤول', 'error');
      return;
    }

    const linkedProj = projects.find(p => p.id === newTaskProjId);
    const assignedEmp = employees.find(e => e.id === newTaskEmpId);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: newTaskProjId,
      projectName: linkedProj ? linkedProj.name : '',
      assignedEmployeeId: newTaskEmpId,
      assignedEmployeeName: assignedEmp ? assignedEmp.name : '',
      title: newTaskTitle,
      description: newTaskDesc,
      priority: newTaskPriority,
      status: 'pending',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +1 week
    };

    setTasks(prev => [newTask, ...prev]);
    setShowTaskModal(false);
    onShowToast(`تم إنشاء المهمة وإسنادها للمهندس ${newTask.assignedEmployeeName}`, 'success');

    // Clear state
    setNewTaskTitle('');
    setNewTaskDesc('');
    setNewTaskProjId('');
    setNewTaskEmpId('');
  };

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName || !newAssetSerial || !newAssetCategory) {
      onShowToast('الرجاء إدخال اسم العهدة ورقمه التسلسلي وفئته', 'error');
      return;
    }

    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: newAssetName,
      serialNumber: newAssetSerial,
      category: newAssetCategory,
      status: 'available'
    };

    setAssets(prev => [newAsset, ...prev]);
    setShowAssetModal(false);
    onShowToast(`تم تسجيل العهدة العينية "${newAssetName}" بنجاح في المستودع الرئيسي`, 'success');

    setNewAssetName('');
    setNewAssetSerial('');
    setNewAssetCategory('');
  };

  const handleApproveAdvanceAdmin = (id: string) => {
    setAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        onShowToast(`تمت موافقة الإدارة الأولية على عهدة بمبلغ ${adv.amount} ريال، تم تحويلها للمحاسب للاعتماد المالي`, 'success');
        return { ...adv, status: 'pending_accountant', approvalDate: new Date().toISOString().split('T')[0] };
      }
      return adv;
    }));
  };

  const handleRejectAdvance = (id: string) => {
    setAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        onShowToast('تم رفض طلب العهدة المالية وإبلاغ الموظف', 'info');
        return { ...adv, status: 'rejected' };
      }
      return adv;
    }));
  };

  const handleAssignAsset = (assetId: string, empId: string) => {
    const emp = employees.find(e => e.id === empId);
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        onShowToast(`تم تسليم العهدة "${asset.name}" بنجاح إلى المهندس الميداني`, 'success');
        return {
          ...asset,
          status: 'assigned',
          assignedToEmployeeId: empId,
          assignedToEmployeeName: emp ? emp.name : 'موظف',
          assignedDate: new Date().toISOString().split('T')[0]
        };
      }
      return asset;
    }));
  };

  // Dynamic Projects Performance Calculations
  const projectPerformanceData = projects.map(project => {
    const projectTasks = tasks.filter(t => t.projectId === project.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'done').length;
    const activeTasks = projectTasks.filter(t => t.status !== 'done').length;

    let totalExpenses = 0;
    advances.forEach(adv => {
      const isCleared = adv.status === 'cleared';
      const isApproved = adv.status === 'approved';
      if (!isCleared && !isApproved) return;

      let amount = adv.amount;
      if (isCleared && adv.clearanceInvoices && adv.clearanceInvoices.length > 0) {
        amount = adv.clearanceInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      }

      const textToSearch = `${adv.reason} ${adv.clearanceInvoices.map(i => i.notes || '').join(' ')}`.toLowerCase();
      const projectKeywords = project.name.split(' ').filter(word => word.length > 3);
      const isMatch = projectKeywords.some(kw => textToSearch.includes(kw.toLowerCase())) ||
                      textToSearch.includes(project.name.toLowerCase()) ||
                      (project.location && textToSearch.includes(project.location.toLowerCase()));

      if (isMatch) {
        totalExpenses += amount;
      } else {
        const empTasks = tasks.filter(t => t.assignedEmployeeId === adv.employeeId && t.projectId === project.id);
        if (empTasks.length > 0) {
          totalExpenses += Math.round(amount / 2);
        } else {
          const sumBudgets = projects.reduce((sum, p) => sum + p.budget, 0);
          const ratio = sumBudgets > 0 ? project.budget / sumBudgets : 1 / projects.length;
          totalExpenses += Math.round(amount * ratio);
        }
      }
    });

    return {
      id: project.id,
      name: project.name.length > 15 ? `${project.name.substring(0, 15)}...` : project.name,
      fullName: project.name,
      tasks: totalTasks,
      completedTasks,
      activeTasks,
      expenses: totalExpenses,
      budget: project.budget,
      remainingBudget: Math.max(0, project.budget - totalExpenses),
    };
  });

  const attendanceTrendData = React.useMemo(() => {
    const countsByDate: { [date: string]: number } = {};
    attendanceLogs.forEach(log => {
      if (!log.date) return;
      countsByDate[log.date] = (countsByDate[log.date] || 0) + 1;
    });

    const dates = Object.keys(countsByDate);
    if (dates.length === 0) {
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('ar-SA');
        countsByDate[dateStr] = Math.floor(Math.random() * 3) + 2;
      }
    }

    return Object.keys(countsByDate)
      .sort((a, b) => {
        const parseDate = (dStr: string) => {
          const parts = dStr.split('/');
          if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
          }
          return new Date(dStr).getTime() || 0;
        };
        return parseDate(a) - parseDate(b);
      })
      .map(date => ({
        date,
        الحضور: countsByDate[date],
      }));
  }, [attendanceLogs]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" style={{ direction: 'rtl' }}>
      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'dashboard' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>لوحة المعلومات</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'projects' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Briefcase className="w-4 h-4" />
          <span>المشاريع ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'tasks' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>المهام الميدانية ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'advances' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Wallet className="w-4 h-4" />
          <span>موافقات العهد والمالية {pendingAdvancesCount > 0 && <span className="mr-1 bg-rose-500 text-white w-2 h-2 rounded-full inline-block animate-ping"></span>}</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'assets' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Database className="w-4 h-4" />
          <span>العهد العينية والأدوات</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'attendance' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Compass className="w-4 h-4" />
          <span>رصد حضور الموظفين (GPS)</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'reports' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>التقارير المالية والأداء</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'security' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Shield className="w-4 h-4" />
          <span>الموظفين والأمان</span>
        </button>
      </div>

      {/* --- DASHBOARD VIEW --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold">المشاريع النشطة</p>
                <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">{activeProjectsCount}</h3>
                <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">من أصل {projects.length} مشاريع</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl text-blue-600">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold">المهام الجارية والمفتوحة</p>
                <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">{pendingTasksCount}</h3>
                <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5 mt-0.5">تتطلب متابعة تشغيلية</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl text-amber-600">
                <CheckSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold">مصروفات العهد المصفاة</p>
                <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">{totalExpenses.toLocaleString()} <span className="text-xs">ر.س</span></h3>
                <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">مستندة بفواتير رسمية</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl text-emerald-600">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold">طلبات عهدة قيد المراجعة</p>
                <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">{pendingAdvancesCount}</h3>
                <span className="text-[9px] text-rose-500 font-semibold animate-pulse mt-0.5">تنتظر موافقتك كمدير</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map GPS tracking section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">التوزيع الجغرافي للمشاريع والعملاء في الرياض</h3>
                  <span className="text-xs text-slate-400">تتبع حي ومباشر للمواقع والموظفين</span>
                </div>
                
                <GPSMap 
                  pins={[
                    ...projects.map(p => ({ id: p.id, name: p.name, lat: p.latitude, lng: p.longitude, type: 'project' as const })),
                    ...leads.map(l => ({ id: l.id, name: l.clientName, lat: l.latitude, lng: l.longitude, type: 'lead' as const }))
                  ]}
                />
              </div>
            </div>

            {/* Recent Notifications / Actions needed */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col max-h-[460px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">طلبات عهد معلقة للإدارة</h3>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-sans">اعتماد أولى</span>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                {advances.filter(a => a.status === 'pending_admin').length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs">رائع! لا توجد طلبات عهد معلقة بانتظارك</p>
                  </div>
                ) : (
                  advances.filter(a => a.status === 'pending_admin').map(adv => (
                    <div key={adv.id} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{adv.employeeName}</p>
                          <p className="text-[10px] text-slate-400">{adv.requestDate}</p>
                        </div>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{adv.amount} ر.س</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">{adv.reason}</p>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveAdvanceAdmin(adv.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          اعتماد وتحويل مالي
                        </button>
                        <button
                          onClick={() => handleRejectAdvance(adv.id)}
                          className="px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-50 text-slate-700 dark:text-slate-300 text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* --- NEW: PERFORMANCE OVERVIEW WIDGET (RECHARTS) --- */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>لوحة قياس الأداء العام والمؤشرات التشغيلية</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">تحليل بياني مباشر لحالة المهام، إنفاق العهد، وحضور الكوادر البشرية بالمشاريع الميدانية</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl font-bold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>تحديث تلقائي</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Chart 1: Tasks per Project */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
                  <span>توزيع المهام والمشروعات الميدانية</span>
                  <span className="text-[10px] text-slate-400 font-normal">عدد المهام لكل مشروع</span>
                </h4>
                <div className="h-64 font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-30 dark:opacity-5" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: appMode === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: appMode === 'dark' ? '#334155' : '#e2e8f0',
                          color: appMode === 'dark' ? '#f8fafc' : '#0f172a',
                          direction: 'rtl',
                          textAlign: 'right',
                          fontSize: '11px',
                          borderRadius: '8px'
                        }}
                        formatter={(value, name) => [value, name === 'tasks' ? 'إجمالي المهام' : name === 'completedTasks' ? 'المهام المنجزة' : 'المهام النشطة']}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="tasks" name="إجمالي المهام" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completedTasks" name="المنجزة" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Total Expenses vs Budget per Project */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
                  <span>ميزانية المشروع مقابل إنفاق العهد الميدانية</span>
                  <span className="text-[10px] text-slate-400 font-normal">ر.س (ريال سعودي)</span>
                </h4>
                <div className="h-64 font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectPerformanceData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-30 dark:opacity-5" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: appMode === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: appMode === 'dark' ? '#334155' : '#e2e8f0',
                          color: appMode === 'dark' ? '#f8fafc' : '#0f172a',
                          direction: 'rtl',
                          textAlign: 'right',
                          fontSize: '11px',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`${value.toLocaleString()} ر.س`, '']}
                      />
                      <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="budget" name="الميزانية المعتمدة" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="الإنفاق الميداني" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Attendance Trends */}
              <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-4 flex items-center justify-between">
                  <span>منحنى حضور القوى البشرية اليومي</span>
                  <span className="text-[10px] text-slate-400 font-normal">تعداد الحضور اليومي</span>
                </h4>
                <div className="h-64 font-sans">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="opacity-30 dark:opacity-5" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 9 }} stroke="#94a3b8" allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: appMode === 'dark' ? '#0f172a' : '#ffffff',
                          borderColor: appMode === 'dark' ? '#334155' : '#e2e8f0',
                          color: appMode === 'dark' ? '#f8fafc' : '#0f172a',
                          direction: 'rtl',
                          textAlign: 'right',
                          fontSize: '11px',
                          borderRadius: '8px'
                        }}
                        formatter={(value) => [value, 'إجمالي حضور الموظفين']}
                      />
                      <Area type="monotone" dataKey="الحضور" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttendance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Quick List Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Projects Quick view */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">أحدث تقارير العمل اليومية المرفوعة من الميدان</h3>
                <span className="text-xs text-slate-400">سجل الإنجاز والمشاكل</span>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {dailyReports.map(rep => (
                  <div key={rep.id} className="p-3 border-b border-slate-100 dark:border-slate-800 last:border-none">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{rep.employeeName}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span>{rep.date}</span>
                          <span>•</span>
                          <span>ساعات العمل: {rep.hoursWorked}</span>
                        </p>
                      </div>
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[9px] px-2 py-0.5 rounded font-bold">✓ تم الرفع</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed mb-2">{rep.accomplished}</p>
                    {rep.problems && (
                      <p className="text-xs bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span><strong>العوائق:</strong> {rep.problems}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active employee clock list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">سجل حضور الموظفين لليوم الجاري</h3>
                <span className="text-xs text-slate-400">تأكيد المواقع بالـ GPS</span>
              </div>

              <div className="space-y-3">
                {attendanceLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">لا يوجد موظفين قاموا بتسجيل حضور لليوم حتى الآن.</div>
                ) : (
                  attendanceLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 p-2 rounded-lg text-xs font-mono font-bold">GPS</div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{log.employeeName}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>الموقع: {log.projectName || 'موقع عام بالرياض'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-left font-mono text-xs">
                        <div className="text-emerald-600 dark:text-emerald-400 font-bold">دخول: {log.checkInTime}</div>
                        {log.checkOutTime ? (
                          <div className="text-rose-500">خروج: {log.checkOutTime}</div>
                        ) : (
                          <div className="text-slate-400">مستمر بالعمل</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PROJECTS VIEW --- */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">إدارة ومتابعة المشاريع التابعة للشركة</h2>
              <p className="text-xs text-slate-400">إنشاء وتوزيع الميزانيات، وتتبع عقود ومواقع الصيانة والإنذار</p>
            </div>
            
            <button
              onClick={() => setShowProjectModal(true)}
              className={`flex items-center gap-1.5 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer ${primaryBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مشروع جديد</span>
            </button>
          </div>

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {p.type === 'alarm' ? '🚨 إنذار حريق' : p.type === 'firefighting' ? '🔥 مكافحة حريق' : p.type === 'generators' ? '⚡ مولدات' : '⚙️ صيانة عامة'}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    <div>
                      <span className="text-slate-400 block font-semibold">الميزانية المقررة</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-sans text-xs">{p.budget.toLocaleString()} ر.س</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">تاريخ الانتهاء</span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono text-[10px]">{p.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 px-4 flex items-center justify-between text-xs text-slate-500">
                  <span>العميل: <strong className="text-slate-700 dark:text-slate-300">{p.clientName}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* New Project Modal */}
          {showProjectModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setShowProjectModal(false)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span>تأسيس مشروع مقاولات جديد</span>
                </h3>

                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المشروع</label>
                    <input
                      type="text"
                      placeholder="مثال: مشروع تركيب مضخات برج التمكين"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الموقع الجغرافي (الوصف)</label>
                    <input
                      type="text"
                      placeholder="مثال: حي الصحافة، طريق الملك فهد، الرياض"
                      value={newProjLocation}
                      onChange={(e) => setNewProjLocation(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع المشروع</label>
                      <select
                        value={newProjType}
                        onChange={(e: any) => setNewProjType(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                      >
                        <option value="alarm">إنذار حريق</option>
                        <option value="firefighting">إطفاء حريق</option>
                        <option value="generators">مولدات طاقة</option>
                        <option value="maintenance">صيانة وتشغيل</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الميزانية التقريبية (ر.س)</label>
                      <input
                        type="number"
                        value={newProjBudget}
                        onChange={(e) => setNewProjBudget(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">العميل المتعاقد</label>
                    <input
                      type="text"
                      placeholder="اسم الشركة أو الجهة المالكة للمشروع"
                      value={newProjClient}
                      onChange={(e) => setNewProjClient(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl text-white shadow-md cursor-pointer ${primaryBg}`}
                    >
                      تأكيد وحفظ المشروع
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProjectModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TASKS VIEW --- */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-sans">جدولة وإسناد المهام الفنية</h2>
              <p className="text-xs text-slate-400">توزيع المهام التشغيلية على المهندسين الميدانيين ومراقبة نسب الإنجاز الفعلي</p>
            </div>

            <button
              onClick={() => setShowTaskModal(true)}
              className={`flex items-center gap-1.5 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer ${primaryBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>إسناد مهمة جديدة</span>
            </button>
          </div>

          {/* Task Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold px-2 py-0.5 rounded text-slate-500 truncate max-w-[200px]">
                      {t.projectName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                    </div>
                  </div>

                  <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{t.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                  <span>المهندس المسؤول: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{t.assignedEmployeeName}</strong></span>
                  <span className="font-mono text-[10px] text-slate-400">{t.startDate} ⟵ {t.endDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* New Task Modal */}
          {showTaskModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                  <span>تجهيز وإسناد مهمة عمل</span>
                </h3>

                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان العمل المطلوب</label>
                    <input
                      type="text"
                      placeholder="مثال: تركيب واختبار نظام كاشف الدخان الحراري بالطابق 2"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">شرح متطلبات العمل بالتفصيل</label>
                    <textarea
                      rows={3}
                      placeholder="اكتب التوجيهات الفنية الواجب تنفيذها، والصور المطلوبة"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الربط بمشروع الشركة</label>
                    <select
                      value={newTaskProjId}
                      onChange={(e) => setNewTaskProjId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    >
                      <option value="">-- اختر المشروع --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الموظف المسؤول</label>
                      <select
                        value={newTaskEmpId}
                        onChange={(e) => setNewTaskEmpId(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                      >
                        <option value="">-- اختر الفني --</option>
                        {employees.filter(e => e.role === 'engineer').map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الأولوية التشغيلية</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e: any) => setNewTaskPriority(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                      >
                        <option value="low">منخفضة</option>
                        <option value="medium">متوسطة</option>
                        <option value="high">عالية جداً (طارئة)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl text-white shadow-md cursor-pointer ${primaryBg}`}
                    >
                      إسناد المهمة فوراً
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ADVANCES & APPROVALS VIEW --- */}
      {activeTab === 'advances' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">اعتمادات العهد والمالية الميدانية</h2>
            <p className="text-xs text-slate-400">مراجعة طلبات العهد والتمويل الطارئ للمهندسين، وتدقيق التصفية والفروقات المالية</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
              جميع طلبات العهد المرفوعة في النظام
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {advances.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">لا توجد أي عهد مسجلة في النظام حالياً.</div>
              ) : (
                advances.map(adv => (
                  <div key={adv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{adv.employeeName}</span>
                        <StatusBadge status={adv.status} />
                        <span className="text-[10px] text-slate-400 font-mono">تاريخ الطلب: {adv.requestDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{adv.reason}</p>
                      
                      {/* clearance details if cleared */}
                      {adv.status === 'cleared' && adv.clearanceInvoices.length > 0 && (
                        <div className="mt-2 text-[11px] bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                          <strong>تفاصيل التصفية:</strong> تم الصرف بموجب الفاتورة رقم <strong>{adv.clearanceInvoices[0].invoiceNumber}</strong> بمبلغ <strong>{adv.clearanceInvoices[0].amount} ر.س</strong>.
                          {adv.differenceAmount !== undefined && (
                            <span className="mr-1.5 font-bold">
                              (الفرق: {adv.differenceAmount > 0 ? `يرجع للشركة ${adv.differenceAmount} ر.س` : `يصرف للموظف ${Math.abs(adv.differenceAmount)} ر.س`})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">قيمة العهدة</span>
                        <strong className="text-base font-sans font-extrabold text-slate-800 dark:text-slate-100">{adv.amount} ر.س</strong>
                      </div>

                      {adv.status === 'pending_admin' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveAdvanceAdmin(adv.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            موافقة
                          </button>
                          <button
                            onClick={() => handleRejectAdvance(adv.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- ASSETS VIEW --- */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">سجل ومستودع العهد العينية</h2>
              <p className="text-xs text-slate-400">إضافة وتسجيل الأدوات والأجهزة الثقيلة، ومتابعة تسليمها وتلفها للموظفين</p>
            </div>

            <button
              onClick={() => setShowAssetModal(true)}
              className={`flex items-center gap-1.5 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md cursor-pointer ${primaryBg}`}
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل أداة / جهاز جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {assets.map(asset => (
              <div key={asset.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-1.5 mb-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    <StatusBadge status={asset.status} />
                  </div>

                  <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{asset.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mb-3">S/N: {asset.serialNumber}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  {asset.status === 'assigned' ? (
                    <div className="text-[11px] text-slate-500">
                      مستلمة لـ: <strong className="text-slate-800 dark:text-slate-200">{asset.assignedToEmployeeName}</strong>
                      <span className="block text-[10px] text-slate-400 font-mono">تاريخ التسليم: {asset.assignedDate}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-semibold">تسليم الأداة لموظف:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignAsset(asset.id, e.target.value);
                            e.target.value = ''; // Reset select after assignment
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-right focus:outline-none"
                      >
                        <option value="">-- اختر مهندس للتسليم --</option>
                        {employees.filter(e => e.role === 'engineer').map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* New Asset Modal */}
          {showAssetModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setShowAssetModal(false)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span>تسجيل عهدة عينية بالشركة</span>
                </h3>

                <form onSubmit={handleCreateAsset} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم العهدة العينية</label>
                    <input
                      type="text"
                      placeholder="مثال: جهاز كاشف التماس الكهربائي فلوك"
                      value={newAssetName}
                      onChange={(e) => setNewAssetName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الرقم التسلسلي (Serial Number)</label>
                    <input
                      type="text"
                      placeholder="مثال: S/N: FL-992-XP"
                      value={newAssetSerial}
                      onChange={(e) => setNewAssetSerial(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الفئة / التصنيف</label>
                    <input
                      type="text"
                      placeholder="مثال: أجهزة قياس فنية، معدات ثقيلة، معدات إطفاء"
                      value={newAssetCategory}
                      onChange={(e) => setNewAssetCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl text-white shadow-md cursor-pointer ${primaryBg}`}
                    >
                      تسجيل العهدة
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAssetModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ATTENDANCE VIEW --- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">رصد الحضور الميداني بالـ GPS</h2>
            <p className="text-xs text-slate-400">تدقيق إحداثيات ومواقع دخول وخروج الموظفين والمهندسين من مواقع المشاريع التابعة للشركة</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map of checkins */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                <div className="mb-3 text-xs font-bold text-slate-800 dark:text-slate-200">التمثيل الجغرافي لحضور اليوم الميداني</div>
                <GPSMap 
                  pins={attendanceLogs.map(log => ({
                    id: log.id,
                    name: `حضور: ${log.employeeName} في ${log.projectName || 'الموقع'}`,
                    lat: log.checkInLat || 24.6934,
                    lng: log.checkInLng || 46.8286,
                    type: 'project'
                  }))}
                />
              </div>
            </div>

            {/* Attendance logs list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">سجل البصمة الجغرافي لليوم</div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {attendanceLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">لا يوجد سجلات حضور لليوم.</div>
                  ) : (
                    attendanceLogs.map(log => (
                      <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs text-slate-800 dark:text-slate-200">{log.employeeName}</strong>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold">بصمة موثقة</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          <span>الموقع: {log.projectName || 'موقع عام'}</span>
                        </p>
                        <div className="grid grid-cols-2 text-[10px] font-mono pt-1 border-t border-slate-200/50 dark:border-slate-700">
                          <span className="text-emerald-600">تسجيل الدخول: {log.checkInTime}</span>
                          <span className="text-rose-500 text-left">تسجيل الخروج: {log.checkOutTime || 'مستمر'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REPORTS VIEW --- */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تقارير الإنجاز والأرباح والخسائر الشاملة</h2>
            <p className="text-xs text-slate-400">عرض مبسط لإيرادات المشاريع، المصاريف التشغيلية ومستوى الربحية</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* simple project budget distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                ميزانية المشاريع النشطة (ر.س)
              </div>
              
              <div className="space-y-4">
                {projects.map(p => {
                  const maxBudget = Math.max(...projects.map(pr => pr.budget));
                  const percentage = (p.budget / maxBudget) * 100;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[250px]">{p.name}</span>
                        <span className="font-sans font-extrabold text-slate-800 dark:text-slate-100">{p.budget.toLocaleString()} ر.س</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* simple profit & loss */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                  ملخص الأرباح والخسائر المبسطة لعام 2026
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <span className="text-slate-500 font-semibold">إجمالي قيم المشاريع المعتمدة</span>
                    <strong className="text-emerald-600 font-sans font-extrabold">
                      {projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()} ر.س
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <span className="text-slate-500 font-semibold">المصروفات التشغيلية الميدانية (فواتير)</span>
                    <strong className="text-rose-500 font-sans font-extrabold">
                      {totalExpenses.toLocaleString()} ر.س
                    </strong>
                  </div>

                  <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <span className="text-slate-500 font-semibold">العهد المالية غير المصفاة حالياً</span>
                    <strong className="text-amber-600 font-sans font-extrabold">
                      {advances.filter(a => a.status === 'approved' || a.status === 'pending_accountant').reduce((sum, a) => sum + a.amount, 0).toLocaleString()} ر.س
                    </strong>
                  </div>

                  <div className="pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">الصافي التقديري المتاح</span>
                    <span className="text-lg font-sans font-extrabold text-emerald-600">
                      {(projects.reduce((sum, p) => sum + p.budget, 0) - totalExpenses).toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECURITY & EMPLOYEES VIEW --- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>إدارة حسابات الموظفين والرقابة الأمنية</span>
              </h2>
              <p className="text-xs text-slate-400">إدارة صلاحيات الوصول الميداني، تصفير كلمات المرور، ومراقبة سجلات أمان النظام الشاملة</p>
            </div>

            {/* Sub Tabs Selector */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex gap-1">
              <button
                onClick={() => setSecSubTab('employees')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${secSubTab === 'employees' ? `${primaryBg} text-white shadow-sm` : 'text-slate-600 dark:text-slate-300 hover:text-slate-800'}`}
              >
                حسابات الموظفين ({employees.length})
              </button>
              <button
                onClick={() => setSecSubTab('logs')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${secSubTab === 'logs' ? `${primaryBg} text-white shadow-sm` : 'text-slate-600 dark:text-slate-300 hover:text-slate-800'}`}
              >
                سجلات أمان النظام ({securityLogs.length})
              </button>
            </div>
          </div>

          {/* Sub-tab 1: EMPLOYEES LIST */}
          {secSubTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  قائمة الموظفين المرخصين للوصول الميداني والمالي
                </div>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm ${primaryBg} hover:opacity-90 transition-all`}
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة موظف جديد</span>
                </button>
              </div>

              {/* Employees Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/55 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4">الموظف / الدور</th>
                        <th className="p-4">الرقم الوظيفي (اسم المستخدم)</th>
                        <th className="p-4">البريد الإلكتروني / الجوال</th>
                        <th className="p-4">حالة الحساب</th>
                        <th className="p-4 text-left">إجراءات الأمان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {employees.map(emp => {
                        // Role localization
                        let roleAr = 'موظف';
                        let roleColor = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
                        if (emp.role === 'admin') {
                          roleAr = 'مدير نظام';
                          roleColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
                        } else if (emp.role === 'engineer') {
                          roleAr = 'مهندس ميداني';
                          roleColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                        } else if (emp.role === 'accountant') {
                          roleAr = 'محاسب مالي';
                          roleColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
                        } else if (emp.role === 'sales') {
                          roleAr = 'ممثل مبيعات';
                          roleColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300';
                        }

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'}
                                  alt={emp.name}
                                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                                />
                                <div>
                                  <div className="font-bold text-slate-800 dark:text-slate-100">{emp.name}</div>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-bold mt-1 ${roleColor}`}>
                                    {roleAr}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                {emp.code}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 dark:text-slate-400 space-y-1">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-sans">{emp.email}</span>
                              </div>
                              <div className="text-[10px] font-sans">{emp.phone}</div>
                            </td>
                            <td className="p-4">
                              {emp.code === '1' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1 rounded-xl">
                                  <Lock className="w-3 h-3" />
                                  <span>حساب الإدارة الفائقة محمية</span>
                                </span>
                              ) : emp.mustChangePassword ? (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-xl">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>مؤقتة - يجب التغيير</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-xl">
                                  <Check className="w-3 h-3" />
                                  <span>نشطة وآمنة</span>
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-left">
                              {emp.code !== '1' ? (
                                <button
                                  onClick={() => handleResetEmployeePassword(emp)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 rounded-xl text-[10px] font-bold hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer"
                                  title="تصفير كلمة المرور وإرسال بريد مؤقت جديد"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>إعادة تعيين كلمة المرور</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">غير متاح للحساب الرئيسي</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: SYSTEM SECURITY LOGS */}
          {secSubTab === 'logs' && (
            <div className="space-y-4">
              {/* Log Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  سجل العمليات ومراقبة محاولات تسجيل الدخول والتهديدات الأمنية
                </div>

                <div className="flex flex-wrap gap-2">
                  {/* Filter by severity */}
                  <select
                    value={logFilterSeverity}
                    onChange={(e) => setLogFilterSeverity(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">كل درجات الخطورة</option>
                    <option value="high">خطورة عالية 🔴</option>
                    <option value="medium">خطورة متوسطة 🟡</option>
                    <option value="low">عادية 🟢</option>
                  </select>

                  {/* Filter by Action */}
                  <select
                    value={logFilterAction}
                    onChange={(e) => setLogFilterAction(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">كل أنواع الأحداث</option>
                    <option value="login_success">دخول ناجح</option>
                    <option value="login_failed">محاولة فاشلة</option>
                    <option value="password_changed">تحديث كلمة المرور</option>
                    <option value="password_reset">تصفير / إضافة موظف</option>
                    <option value="rate_limit_locked">حظر مؤقت (حد السرعة)</option>
                  </select>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/55 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4">التوقيت</th>
                        <th className="p-4">النوع / الإجراء</th>
                        <th className="p-4">المستخدم</th>
                        <th className="p-4">تفاصيل العملية</th>
                        <th className="p-4 text-left">مستوى الخطورة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {securityLogs
                        .filter(log => {
                          if (logFilterSeverity !== 'all' && log.severity !== logFilterSeverity) return false;
                          if (logFilterAction !== 'all' && log.action !== logFilterAction) return false;
                          return true;
                        })
                        .map(log => {
                          // Action Localization
                          let actionAr = log.action;
                          let actionColor = 'bg-slate-100 text-slate-700';
                          if (log.action === 'login_success') {
                            actionAr = '🔓 دخول ناجح';
                            actionColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400';
                          } else if (log.action === 'login_failed') {
                            actionAr = '❌ محاولة فاشلة';
                            actionColor = 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400';
                          } else if (log.action === 'password_changed') {
                            actionAr = '⚙️ تغيير الباسورد';
                            actionColor = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400';
                          } else if (log.action === 'password_reset') {
                            actionAr = '🔑 تصفير كلمة المرور';
                            actionColor = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400';
                          } else if (log.action === 'rate_limit_locked') {
                            actionAr = '🚨 حظر مؤقت للحساب';
                            actionColor = 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400';
                          }

                          // Severity Badge
                          let severityAr = 'منخفضة';
                          let severityBadge = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                          if (log.severity === 'high') {
                            severityAr = 'عالية جداً';
                            severityBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300';
                          } else if (log.severity === 'medium') {
                            severityAr = 'متوسطة';
                            severityBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
                          }

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="p-4 text-slate-400 font-sans">{log.timestamp}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${actionColor}`}>
                                  {actionAr}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {log.username}
                                </span>
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">{log.details}</td>
                              <td className="p-4 text-left">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${severityBadge}`}>
                                  {severityAr}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                      {securityLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            لا توجد سجلات أمان متوفرة حالياً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- ADD EMPLOYEE MODAL --- */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" style={{ direction: 'rtl' }}>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">تسجيل موظف جديد وتوليد الاعتمادات</h3>
              <button
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الاسم الكامل للموظف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أ. محمد العتيبي"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الرقم الوظيفي (اسم المستخدم)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 1004"
                    value={newEmpCode}
                    onChange={(e) => setNewEmpCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">الدور والجهوزية</label>
                  <select
                    value={newEmpRole}
                    onChange={(e) => setNewEmpRole(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="engineer">مهندس ميداني</option>
                    <option value="accountant">محاسب مالي</option>
                    <option value="sales">مبيعات / تسويق</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">البريد الإلكتروني (لتلقي كلمة المرور)</label>
                <input
                  type="email"
                  required
                  placeholder="name@coreops.sa"
                  value={newEmpEmail}
                  onChange={(e) => setNewEmpEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-sans"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">رقم الهاتف الجوال</label>
                <input
                  type="text"
                  placeholder="+966 50 123 4567"
                  value={newEmpPhone}
                  onChange={(e) => setNewEmpPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-sans"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-2xl text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                ℹ️ بمجرد الحفظ، سيتولى النظام توليد كلمة مرور عشوائية مؤقتة تلقائياً ومحاكاة إرسالها على بريد الموظف. سيُجبر الموظف على وضع كلمة مرور جديدة عند أول محاولة دخول له.
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer ${primaryBg} hover:opacity-90 transition-all`}
                >
                  تسجيل وتوليد كلمة المرور
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- GENERATED CREDENTIALS DETAILS OVERLAY MODAL --- */}
      {generatedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" style={{ direction: 'rtl' }}>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">تم توليد بيانات الحساب بنجاح!</h3>
                <p className="text-[10px] text-slate-400 font-semibold">محاكاة إرسال الإيميل التلقائي نشطة حالياً</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">اسم الموظف:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{generatedCreds.name}</strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">الرقم الوظيفي (اسم المستخدم):</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md font-extrabold">{generatedCreds.code}</strong>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold">البريد الإلكتروني المعتمد:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-sans">{generatedCreds.email}</strong>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold">كلمة المرور المؤقتة المنتجة:</span>
                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl w-full text-center">
                    <span className="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400 tracking-wider">
                      {generatedCreds.tempPass}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed text-center bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                📧 <strong>نظام إشعار الموظفين:</strong> تم محاكاة إرسال بريد إلكتروني يحتوي على بيانات الاعتماد إلى <strong>{generatedCreds.email}</strong>. سيُطالب الموظف بتحديث كلمة المرور الخاصة به فوراً عند أول محاولة لتسجيل الدخول للحفاظ على الخصوصية والموثوقية.
              </div>

              <button
                onClick={() => setGeneratedCreds(null)}
                className={`w-full py-2.5 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md ${primaryBg} hover:opacity-90 transition-all`}
              >
                حسناً، فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
