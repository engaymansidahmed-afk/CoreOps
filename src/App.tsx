/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ThemeProvider, useAppTheme } from './components/ThemeContext';
import { RoleSwitcher } from './components/RoleSwitcher';
import { AdminDashboard } from './components/AdminDashboard';
import { FieldEngineerPanel } from './components/FieldEngineerPanel';
import { AccountantPanel } from './components/AccountantPanel';
import { SalesPanel } from './components/SalesPanel';
import { ToastContainer, useToast } from './components/SharedComponents';
import { LoginScreen } from './components/LoginScreen';
import { initializeStorage, loadFromStorage, saveToStorage, INITIAL_EMPLOYEES, INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_ADVANCES, INITIAL_ASSETS, INITIAL_LEADS, INITIAL_DAILY_REPORTS, INITIAL_ATTENDANCE, INITIAL_NOTIFICATIONS } from './data';
import { Employee, Project, Task, CashAdvance, Asset, Lead, DailyReport, AttendanceLog, SystemNotification, EmployeeRole, SecurityLog } from './types';
import { Bell, Briefcase, Hammer, Wallet, Shield, Users, Info, HelpCircle, LogOut, Check, ChevronDown, Clock, MessageSquarePlus, Download } from 'lucide-react';

const INITIAL_SECURITY_LOGS: SecurityLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString('ar-SA'),
    action: 'password_reset',
    username: 'admin',
    details: 'تم تأسيس حساب م/ أيمن كمدير نظام فائق بموجب لوائح GCC للأمن وبدء تشغيل النظام',
    severity: 'medium'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 2).toLocaleString('ar-SA'),
    action: 'login_success',
    username: '1',
    details: 'تم رصد تسجيل دخول ناجح لحساب المدير العام الفائق م/ أيمن',
    severity: 'low'
  }
];

function CoreOpsApp() {
  const { themeColor, appMode, primaryBg, primaryText, primaryLightBg, badgeBg, badgeText } = useAppTheme();
  const { toasts, showToast, removeToast } = useToast();

  // Session Access Controls
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    return loadFromStorage<Employee | null>('current_user', null);
  });
  const [currentRole, setCurrentRole] = useState<EmployeeRole>(() => {
    return loadFromStorage<EmployeeRole>('current_role', 'admin');
  });

  // Load state from localStorage or seed initial data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [advances, setAdvances] = useState<CashAdvance[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Listen for PWA Install Prompt (Android & Desktop support)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
      console.log('PWA installation prompt is available');
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed successfully');
      showToast('🎉 تهانينا! تم تثبيت تطبيق CoreOps بنجاح على جهازك', 'success');
      handleAddSecurityLog('login_success', currentUser?.code || 'system', 'تم تثبيت تطبيق الويب المستقل (PWA) بنجاح على الجهاز', 'low');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [currentUser]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User installation choice outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Initialize storage once on boot
  useEffect(() => {
    initializeStorage();
    setEmployees(loadFromStorage<Employee[]>('employees', INITIAL_EMPLOYEES));
    setProjects(loadFromStorage<Project[]>('projects', INITIAL_PROJECTS));
    setTasks(loadFromStorage<Task[]>('tasks', INITIAL_TASKS));
    setAdvances(loadFromStorage<CashAdvance[]>('advances', INITIAL_ADVANCES));
    setAssets(loadFromStorage<Asset[]>('assets', INITIAL_ASSETS));
    setLeads(loadFromStorage<Lead[]>('leads', INITIAL_LEADS));
    setDailyReports(loadFromStorage<DailyReport[]>('reports', INITIAL_DAILY_REPORTS));
    setAttendanceLogs(loadFromStorage<AttendanceLog[]>('attendance', INITIAL_ATTENDANCE));
    setNotifications(loadFromStorage<SystemNotification[]>('notifications', INITIAL_NOTIFICATIONS));
    setSecurityLogs(loadFromStorage<SecurityLog[]>('security_logs', INITIAL_SECURITY_LOGS));

    // Welcome notice
    showToast('🚀 أهلاً بك في CoreOps - نظام إدارة المقاولات والتشغيل المتكامل', 'success');
  }, []);

  // Save states back to localStorage whenever they change
  useEffect(() => {
    saveToStorage('current_user', currentUser);
  }, [currentUser]);

  useEffect(() => {
    saveToStorage('current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    if (employees.length > 0) saveToStorage('employees', employees);
  }, [employees]);

  useEffect(() => {
    if (projects.length > 0) saveToStorage('projects', projects);
  }, [projects]);

  useEffect(() => {
    if (tasks.length > 0) saveToStorage('tasks', tasks);
  }, [tasks]);

  useEffect(() => {
    if (advances.length > 0) saveToStorage('advances', advances);
  }, [advances]);

  useEffect(() => {
    if (assets.length > 0) saveToStorage('assets', assets);
  }, [assets]);

  useEffect(() => {
    if (leads.length > 0) saveToStorage('leads', leads);
  }, [leads]);

  useEffect(() => {
    if (dailyReports.length > 0) saveToStorage('reports', dailyReports);
  }, [dailyReports]);

  useEffect(() => {
    if (attendanceLogs.length > 0) saveToStorage('attendance', attendanceLogs);
  }, [attendanceLogs]);

  useEffect(() => {
    if (notifications.length > 0) saveToStorage('notifications', notifications);
  }, [notifications]);

  const handleAddSecurityLog = (action: SecurityLog['action'], username: string, details: string, severity: SecurityLog['severity']) => {
    const newLog: SecurityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toLocaleString('ar-SA'),
      action,
      username,
      details,
      severity
    };
    setSecurityLogs(prev => {
      const updated = [newLog, ...prev];
      saveToStorage('security_logs', updated);
      return updated;
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      handleAddSecurityLog('login_failed', currentUser.code, 'تم تسجيل خروج آمن ومصادق للمستخدم من الجلسة', 'low');
    }
    setCurrentUser(null);
    showToast('🔒 تم تسجيل الخروج بنجاح وتأمين لوحة العمل', 'info');
  };

  // Handle active notifications
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  const handleMarkNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setShowNotifications(false);
    showToast('تم تعليم جميع الإشعارات كمقروءة', 'info');
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
    showToast('تم تفريغ صندوق الإشعارات', 'info');
  };

  const handleRoleChange = (role: EmployeeRole) => {
    setCurrentRole(role);
    const names = {
      admin: 'أ. سارة القحطاني (👑 الإدارة)',
      engineer: 'م. أحمد الحربي (👷 الميدان)',
      accountant: 'أ. خالد الدوسري (💰 المحاسب)',
      sales: 'أ. فهد الشمري (📢 المبيعات)'
    };
    showToast(`تم تبديل هوية المستخدم الحالي إلى: ${names[role]}`, 'info');
  };

  // Dispatch custom background simulation triggers
  // For example, when a new lead is assigned from Sales, we add a notification.
  useEffect(() => {
    // Watch leads to trigger notifications when they change to "assigned"
    const assignedLeadsWithNoNotif = leads.filter(l => l.status === 'assigned');
    if (assignedLeadsWithNoNotif.length > INITIAL_LEADS.filter(l => l.status === 'assigned').length) {
      const lastAssigned = assignedLeadsWithNoNotif[0];
      const newNotif: SystemNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'تم إسناد عميل للمعاينة الفنية',
        body: `قام مسؤل المبيعات بتوجيه العميل "${lastAssigned.clientName}" إليك للمعاينة والرفع الفني بموقع: ${lastAssigned.locationName}`,
        date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'lead'
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, [leads]);

  useEffect(() => {
    // Watch tasks to trigger notification for newly added tasks
    if (tasks.length > INITIAL_TASKS.length) {
      const lastTask = tasks[0];
      const newNotif: SystemNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: 'مهمة عمل جديدة مسندة إليك',
        body: `تم إسناد مهمة "${lastTask.title}" إليك بنجاح من قبل الإدارة.`,
        date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'task'
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, [tasks]);

  useEffect(() => {
    // Watch advances to trigger notification on new cash advance requests
    if (advances.length > INITIAL_ADVANCES.length) {
      const lastAdv = advances[0];
      if (lastAdv.status === 'pending_admin') {
        const newNotif: SystemNotification = {
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'طلب عهدة مالية بانتظار الاعتماد',
          body: `قام المهندس ${lastAdv.employeeName} بطلب عهدة بمبلغ ${lastAdv.amount} ر.س لشراء مستلزمات طارئة.`,
          date: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          read: false,
          type: 'advance'
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }
  }, [advances]);

  // If not logged in, render only the secure login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <LoginScreen
          employees={employees.length > 0 ? employees : INITIAL_EMPLOYEES}
          setEmployees={setEmployees}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setCurrentRole(user.role);
            handleAddSecurityLog('login_success', user.code, `تسجيل دخول ناجح للمستخدم (${user.name}) عبر البوابة الأمنية`, 'low');
          }}
          onShowToast={showToast}
          onAddSecurityLog={handleAddSecurityLog}
        />
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Current active employee profile info
  const activeEmployee = employees.find(e => e.role === currentRole) || INITIAL_EMPLOYEES[0];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 pb-16`}>
      {/* 🚀 SIMULATOR BANNER CONTROLLER */}
      <RoleSwitcher 
        currentRole={currentRole} 
        onRoleChange={handleRoleChange} 
        employees={employees.length > 0 ? employees : INITIAL_EMPLOYEES} 
      />

      {/* --- PREMIUM REAL HEADER APP BAR --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between" style={{ direction: 'rtl' }}>
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className={`${primaryBg} text-white p-2 rounded-2xl shadow-md transform hover:rotate-6 transition-all`}>
              <Briefcase className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg md:text-xl text-slate-800 dark:text-slate-100 tracking-tight font-sans">
                Core<span className={primaryText}>Ops</span>
              </span>
              <p className="text-[10px] text-slate-400 font-semibold font-sans mt-0.5 hidden sm:block">
                النظام الذكي المتكامل لإدارة المقاولات والصيانة الميدانية
              </p>
            </div>
          </div>

          {/* User Profile Info HUD + Notifications */}
          <div className="flex items-center gap-4">
            {/* PWA Install Button (Header) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs animate-pulse"
                title="تثبيت التطبيق على جهازك"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">تثبيت التطبيق</span>
              </button>
            )}

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors relative cursor-pointer"
                id="btn-notifications-bell"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Box */}
              {showNotifications && (
                <div className="absolute left-0 mt-2.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden text-right">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">صندوق الإشعارات والعمليات</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkNotificationsAsRead}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        مقروء الكل
                      </button>
                      <button
                        onClick={handleClearNotifications}
                        className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                      >
                        مسح
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs font-sans">
                        صندوق الوارد فارغ، لا توجد إشعارات حالياً.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-right ${!notif.read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}>
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">{notif.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{notif.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Badge HUD */}
            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-800 pr-4">
              <img
                src={activeEmployee.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop"}
                alt={activeEmployee.name}
                className="w-8.5 h-8.5 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">{activeEmployee.name}</span>
                <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-0.5 ${badgeBg} ${badgeText}`}>
                  {currentRole === 'admin' ? '👑 مدير النظام' : currentRole === 'engineer' ? '👷 مهندس ميداني' : currentRole === 'accountant' ? '💰 محاسب مالي' : '📢 مبيعات وتسويق'}
                </span>
              </div>

              {/* Secure Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 mr-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="تسجيل الخروج الآمن"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- GLOBAL APP NOTIFICATION BANNER (IF GPS SITE CHECK-IN IS ACTIVE) --- */}
      {currentRole === 'engineer' && attendanceLogs.length > 0 && !attendanceLogs[attendanceLogs.length - 1].checkOutTime && (
        <div className="bg-emerald-500 text-white text-xs py-2 px-4 shadow-sm animate-pulse flex items-center justify-center gap-2 text-center" style={{ direction: 'rtl' }}>
          <span className="inline-block w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
          <span>تنبيه تشغيلي: أنت مسجل حضور نشط حالياً بمشروع <strong>{attendanceLogs[attendanceLogs.length - 1].projectName}</strong> عبر بصمة الـ GPS</span>
        </div>
      )}

      {/* --- RENDER CONTENT BASED ON ACTIVE LOGGED ROLE --- */}
      <main className="transition-all duration-300">
        {currentRole === 'admin' && (
          <AdminDashboard 
            currentUser={currentUser!}
            projects={projects}
            setProjects={setProjects}
            tasks={tasks}
            setTasks={setTasks}
            advances={advances}
            setAdvances={setAdvances}
            assets={assets}
            setAssets={setAssets}
            employees={employees}
            setEmployees={setEmployees}
            attendanceLogs={attendanceLogs}
            leads={leads}
            dailyReports={dailyReports}
            onShowToast={showToast}
            securityLogs={securityLogs}
            onAddSecurityLog={handleAddSecurityLog}
          />
        )}

        {currentRole === 'engineer' && (
          <FieldEngineerPanel 
            currentUser={currentUser!}
            employees={employees}
            tasks={tasks}
            setTasks={setTasks}
            projects={projects}
            advances={advances}
            setAdvances={setAdvances}
            assets={assets}
            setAssets={setAssets}
            attendanceLogs={attendanceLogs}
            setAttendanceLogs={setAttendanceLogs}
            dailyReports={dailyReports}
            setDailyReports={setDailyReports}
            onShowToast={showToast}
          />
        )}

        {currentRole === 'accountant' && (
          <AccountantPanel 
            currentUser={currentUser!}
            employees={employees}
            tasks={tasks}
            advances={advances}
            setAdvances={setAdvances}
            projects={projects}
            onShowToast={showToast}
          />
        )}

        {currentRole === 'sales' && (
          <SalesPanel 
            currentUser={currentUser!}
            leads={leads}
            setLeads={setLeads}
            employees={employees}
            tasks={tasks}
            setTasks={setTasks}
            projects={projects}
            setProjects={setProjects}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* PWA Floating Installation Prompt Banner (Arabic) */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-4 right-4 left-4 md:right-auto md:left-4 md:max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 z-50 flex flex-col gap-3 animate-bounce" style={{ direction: 'rtl' }}>
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-xl shrink-0 mt-0.5">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-100">تثبيت تطبيق CoreOps على جهازك</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                احصل على وصول سريع ومستقل لجميع ميزات النظام التشغيلية الميدانية، إنفاق العهد، ومتابعة المهام مع دعم كامل للعمل بدون اتصال بالإنترنت (Offline Mode).
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 mt-1 border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setShowInstallBanner(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              ليس الآن
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت الآن</span>
            </button>
          </div>
        </div>
      )}

      {/* Realtime Toasts UI Renderer */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CoreOpsApp />
    </ThemeProvider>
  );
}
