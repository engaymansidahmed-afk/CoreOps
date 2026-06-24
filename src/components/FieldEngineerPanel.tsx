/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Task, Project, CashAdvance, Asset, AttendanceLog, DailyReport } from '../types';
import { StatusBadge, PriorityBadge, SignaturePad, FileUpload } from './SharedComponents';
import { useAppTheme } from './ThemeContext';
import { MapPin, Hammer, Wallet, Calendar, Clock, Image, FileText, CheckCircle, Upload, AlertCircle, Play, ChevronLeft, Check, Sparkles, X } from 'lucide-react';

interface FieldEngineerPanelProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  advances: CashAdvance[];
  setAdvances: React.Dispatch<React.SetStateAction<CashAdvance[]>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  dailyReports: DailyReport[];
  setDailyReports: React.Dispatch<React.SetStateAction<DailyReport[]>>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FieldEngineerPanel: React.FC<FieldEngineerPanelProps> = ({
  tasks, setTasks,
  projects,
  advances, setAdvances,
  assets, setAssets,
  attendanceLogs, setAttendanceLogs,
  dailyReports, setDailyReports,
  onShowToast
}) => {
  const { primaryBg, primaryText, primaryLightBg, badgeBg, badgeText } = useAppTheme();
  
  // Tabs: tasks, attendance, cash_advances, assets, daily_reports
  const [activeTab, setActiveTab] = useState<'tasks' | 'attendance' | 'cash_advances' | 'assets' | 'daily_reports'>('tasks');
  
  // Task action state
  const [activeTaskToReport, setActiveTaskToReport] = useState<Task | null>(null);
  const [beforePhoto, setBeforePhoto] = useState('');
  const [afterPhoto, setAfterPhoto] = useState('');
  const [reportText, setReportText] = useState('');
  const [signature, setSignature] = useState('');

  // Attendance Clock-in State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const isClockedIn = attendanceLogs.length > 0 && !attendanceLogs[attendanceLogs.length - 1].checkOutTime;

  // New Cash Advance Request State
  const [advanceAmount, setAdvanceAmount] = useState(500);
  const [advanceReason, setAdvanceReason] = useState('');

  // Clearance Advance State
  const [activeAdvanceToClear, setActiveAdvanceToClear] = useState<CashAdvance | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [invoicePhoto, setInvoicePhoto] = useState('');
  const [invoiceCategory, setInvoiceCategory] = useState('مستلزمات صيانة عامة');
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // General Daily Report State
  const [hoursWorked, setHoursWorked] = useState(8);
  const [accomplished, setAccomplished] = useState('');
  const [problems, setProblems] = useState('');
  const [generalBefore, setGeneralBefore] = useState('');
  const [generalAfter, setGeneralAfter] = useState('');

  // --- ACTIONS ---

  // Task Status changes
  const handleStartTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        onShowToast('تم بدء تشغيل المهمة وبصمة الموقع الجغرافي نشطة', 'info');
        return { ...t, status: 'in_progress' };
      }
      return t;
    }));
  };

  const handleOpenReportModal = (task: Task) => {
    setActiveTaskToReport(task);
    setBeforePhoto(task.beforePhoto || '');
    setAfterPhoto(task.afterPhoto || '');
    setReportText('');
    setSignature('');
  };

  const handleSubmitTaskReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaskToReport) return;
    if (!reportText) {
      onShowToast('الرجاء كتابة تفاصيل ما تم إنجازه فنيًا بموقع العميل', 'error');
      return;
    }
    if (!signature) {
      onShowToast('توقيع العميل إلزامي لإنهاء وإتمام مهام الصيانة والتشغيل', 'error');
      return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id === activeTaskToReport.id) {
        onShowToast(`تم إنهاء المهمة "${t.title}" بنجاح، ورفع التوقيع والصور الميدانية`, 'success');
        return {
          ...t,
          status: 'done',
          beforePhoto,
          afterPhoto,
          reportText,
          clientSignature: signature,
          reportDate: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    }));

    setActiveTaskToReport(null);
  };

  // Attendance Clock in / out
  const handleClockIn = () => {
    if (!selectedProjectId) {
      onShowToast('الرجاء تحديد موقع المشروع الميداني للتسجيل', 'error');
      return;
    }

    const matchedProj = projects.find(p => p.id === selectedProjectId);

    const newLog: AttendanceLog = {
      id: `att-${Date.now()}`,
      employeeId: 'emp-1001',
      employeeName: 'م. أحمد الحربي',
      date: new Date().toISOString().split('T')[0],
      checkInTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      checkInLat: matchedProj ? matchedProj.latitude : 24.6934,
      checkInLng: matchedProj ? matchedProj.longitude : 46.8286,
      projectName: matchedProj ? matchedProj.name : 'موقع الشركة العام'
    };

    setAttendanceLogs(prev => [...prev, newLog]);
    onShowToast(`تم تسجيل الحضور في مشروع: ${newLog.projectName} بنجاح عبر الـ GPS`, 'success');
  };

  const handleClockOut = () => {
    if (attendanceLogs.length === 0) return;
    
    setAttendanceLogs(prev => {
      const updated = [...prev];
      const lastIndex = updated.length - 1;
      updated[lastIndex] = {
        ...updated[lastIndex],
        checkOutTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
        checkOutLat: updated[lastIndex].checkInLat ? updated[lastIndex].checkInLat + 0.0002 : 24.6936,
        checkOutLng: updated[lastIndex].checkInLng ? updated[lastIndex].checkInLng - 0.0001 : 46.8285,
      };
      return updated;
    });

    onShowToast('تم تسجيل الانصراف من موقع العمل بأمان، شكراً لجهودك اليوم!', 'success');
  };

  // Cash advances
  const handleRequestAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceReason) {
      onShowToast('الرجاء كتابة سبب طلب العهدة المالية والمشتريات المطلوبة', 'error');
      return;
    }

    const newAdv: CashAdvance = {
      id: `adv-${Date.now()}`,
      employeeId: 'emp-1001',
      employeeName: 'م. أحمد الحربي',
      amount: Number(advanceAmount),
      reason: advanceReason,
      status: 'pending_admin',
      requestDate: new Date().toISOString().split('T')[0],
      clearanceInvoices: []
    };

    setAdvances(prev => [newAdv, ...prev]);
    onShowToast(`تم إرسال طلب العهدة بمبلغ ${advanceAmount} ريال للإدارة للمراجعة والاعتماد المالي`, 'success');
    setAdvanceReason('');
    setAdvanceAmount(500);
  };

  const handleClearAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdvanceToClear) return;
    if (!invoiceNumber || !invoiceAmount || !invoicePhoto) {
      onShowToast('الرجاء إدخال رقم الفاتورة، القيمة وتصويرها لتتم التصفية المعتمدة', 'error');
      return;
    }

    const difference = activeAdvanceToClear.amount - Number(invoiceAmount);

    setAdvances(prev => prev.map(adv => {
      if (adv.id === activeAdvanceToClear.id) {
        onShowToast(`تم تقديم التصفية للفاتورة بنجاح. الفرق المالي: ${difference > 0 ? `يرجع للشركة ${difference} ر.س` : `مستحق لك ${Math.abs(difference)} ر.س`}`, 'success');
        return {
          ...adv,
          status: 'cleared',
          clearanceDate: new Date().toISOString().split('T')[0],
          clearanceInvoices: [
            {
              id: `inv-${Date.now()}`,
              amount: Number(invoiceAmount),
              invoiceNumber,
              photo: invoicePhoto,
              category: invoiceCategory,
              date: new Date().toISOString().split('T')[0],
              notes: invoiceNotes
            }
          ],
          differenceAmount: difference
        };
      }
      return adv;
    }));

    setActiveAdvanceToClear(null);
    setInvoiceNumber('');
    setInvoiceAmount(0);
    setInvoicePhoto('');
    setInvoiceNotes('');
  };

  // Physical Assets reporting
  const handleReportAssetDamage = (id: string) => {
    setAssets(prev => prev.map(ass => {
      if (ass.id === id) {
        onShowToast(`تم إبلاغ إدارة المستودعات واللوجستيات عن تلف الأداة "${ass.name}" للفحص والتبديل`, 'info');
        return { ...ass, status: 'damaged' };
      }
      return ass;
    }));
  };

  // Submit Daily general report
  const handleSubmitGeneralReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accomplished) {
      onShowToast('الرجاء تعبئة ما قمت بإنجازه اليوم لتضمينه بالتقرير', 'error');
      return;
    }

    const newReport: DailyReport = {
      id: `rep-${Date.now()}`,
      employeeId: 'emp-1001',
      employeeName: 'م. أحمد الحربي',
      date: new Date().toISOString().split('T')[0],
      hoursWorked,
      accomplished,
      problems: problems || undefined,
      beforePhoto: generalBefore || undefined,
      afterPhoto: generalAfter || undefined
    };

    setDailyReports(prev => [newReport, ...prev]);
    onShowToast('تم رفع تقريرك اليومي الشامل للإدارة بنجاح', 'success');
    setAccomplished('');
    setProblems('');
    setGeneralBefore('');
    setGeneralAfter('');
  };

  const myTasks = tasks.filter(t => t.assignedEmployeeId === 'emp-1001');
  const myAdvances = advances.filter(a => a.employeeId === 'emp-1001');
  const myAssets = assets.filter(a => a.assignedToEmployeeId === 'emp-1001');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" style={{ direction: 'rtl' }}>
      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'tasks' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Hammer className="w-4 h-4" />
          <span>مهام الصيانة الموكلة إليك ({myTasks.filter(t => t.status !== 'done').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'attendance' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <MapPin className="w-4 h-4" />
          <span>حضور وانصراف (GPS)</span>
        </button>

        <button
          onClick={() => setActiveTab('cash_advances')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'cash_advances' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Wallet className="w-4 h-4" />
          <span>طلب و تصفية عهدتك المالية</span>
        </button>

        <button
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'assets' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Hammer className="w-4 h-4" />
          <span>أدواتك ومعداتك ({myAssets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('daily_reports')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'daily_reports' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <FileText className="w-4 h-4" />
          <span>التقرير اليومي العام</span>
        </button>
      </div>

      {/* --- TASKS VIEW --- */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">مهامك وجداول العمل الميداني</h2>
            <p className="text-xs text-slate-400">ابدأ بتغيير الحالة عند المباشرة بالموقع، وقم برفع تقرير العميل بعد اكتمال الصيانة أو التركيب</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold px-2 py-0.5 rounded text-slate-500 truncate max-w-[200px]">
                      {task.projectName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <PriorityBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">{task.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">{task.description}</p>
                </div>

                {/* Task actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-mono text-[10px] text-slate-400">تاريخ التسليم: {task.endDate}</span>
                  
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className={`flex items-center gap-1 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer ${primaryBg}`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>بدء العمل بالموقع</span>
                    </button>
                  )}

                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleOpenReportModal(task)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>إتمام ورفع تقرير العميل</span>
                    </button>
                  )}

                  {task.status === 'done' && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1 font-sans">
                      <Check className="w-4 h-4" />
                      <span>تم تسليمه وتوقيعه</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Report Submission Modal */}
          {activeTaskToReport && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-lg w-full shadow-2xl relative text-right my-8">
                <button
                  onClick={() => setActiveTaskToReport(null)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>تقرير إتمام مهمة: {activeTaskToReport.title}</span>
                </h3>

                <form onSubmit={handleSubmitTaskReport} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  {/* Photo Before and After */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileUpload 
                      label="صورة قبل الصيانة/التركيب" 
                      previewImage={beforePhoto}
                      onUpload={(url) => setBeforePhoto(url)} 
                    />
                    <FileUpload 
                      label="صورة بعد الإنجاز والتشغيل" 
                      previewImage={afterPhoto}
                      onUpload={(url) => setAfterPhoto(url)} 
                    />
                  </div>

                  {/* Technical description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">التقرير الفني لما تم إنجازه</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="صف ما قمت به من صيانة، برمجة، تغيير قطع أو فحص بموقع العميل..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  {/* Customer digital signature */}
                  <SignaturePad 
                    onSave={(dataUrl) => setSignature(dataUrl)}
                    onClear={() => setSignature('')}
                    savedSignature={signature}
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 font-bold text-xs py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                    >
                      إتمام وإرسال التقرير للإدارة والعميل
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTaskToReport(null)}
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

      {/* --- GPS ATTENDANCE --- */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-sans">بصمة الحضور والانصراف الميدانية</h2>
            <p className="text-xs text-slate-400">قم بتأكيد موقعك الميداني بالـ GPS عند الحضور لموقع مشروع الصيانة أو الإطفاء، وتسجيل الانصراف</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">تسجيل حضور العمل الفعلي بالموقع</div>

              {isClockedIn ? (
                <div className="space-y-4 text-center py-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 p-3.5 rounded-xl text-emerald-700 dark:text-emerald-400">
                    <Clock className="w-8 h-8 text-emerald-600 mx-auto mb-1 animate-pulse" />
                    <p className="text-xs font-bold">حضورك نشط الآن بالموقع الجغرافي</p>
                    <span className="text-[10px] font-mono">الدخول: {attendanceLogs[attendanceLogs.length - 1].checkInTime}</span>
                  </div>

                  <button
                    onClick={handleClockOut}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer transition-colors"
                  >
                    بصمة انصراف ومغادرة الموقع
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اختر موقع المشروع لتأكيد الحضور</label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    >
                      <option value="">-- اختر موقع المشروع --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleClockIn}
                    className={`w-full text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer flex items-center justify-center gap-1.5 ${primaryBg}`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>تسجيل حضور (بصمة GPS)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Attendance history */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">سجل البصمات الجغرافي الخاص بك</div>
              
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendanceLogs.map(log => (
                  <div key={log.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">{log.projectName}</strong>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{log.date}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-emerald-600 block">دخول: {log.checkInTime}</span>
                      {log.checkOutTime && <span className="text-rose-500 block">انصراف: {log.checkOutTime}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CASH ADVANCES & CLEARANCES --- */}
      {activeTab === 'cash_advances' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Request form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Wallet className="w-4.5 h-4.5 text-blue-500" />
                <span>طلب عهدة نقدية للمشتريات الميدانية</span>
              </div>

              <form onSubmit={handleRequestAdvance} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ المطلوب (ر.س)</label>
                  <input
                    type="number"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سبب صرف وتصفية العهدة بالتفصيل</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: شراء كوابل وصمامات إطفاء طارئة لمشروع السلي لتعطل تمديد الدفاع المدني"
                    value={advanceReason}
                    onChange={(e) => setAdvanceReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer ${primaryBg}`}
                >
                  إرسال الطلب للاعتماد
                </button>
              </form>
            </div>

            {/* Advances list & clearances */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">سجل العهد المالية والتصفيات الخاصة بك</div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {myAdvances.map(adv => (
                  <div key={adv.id} className="py-4 space-y-2.5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-0.5 text-right">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{adv.amount} ر.س</span>
                        <p className="text-[10px] text-slate-400 font-mono">{adv.requestDate}</p>
                      </div>
                      <StatusBadge status={adv.status} />
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{adv.reason}</p>

                    {/* Clear Advance button if approved */}
                    {adv.status === 'approved' && (
                      <button
                        onClick={() => {
                          setActiveAdvanceToClear(adv);
                          setInvoiceAmount(adv.amount);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer"
                      >
                        تصفية ورفع الفواتير لهذه العهدة
                      </button>
                    )}

                    {adv.status === 'cleared' && adv.clearanceInvoices.length > 0 && (
                      <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                        <strong>تمت التصفية بنجاح:</strong> الفاتورة <strong>{adv.clearanceInvoices[0].invoiceNumber}</strong> بقيمة <strong>{adv.clearanceInvoices[0].amount} ر.س</strong>.
                        {adv.differenceAmount !== undefined && (
                          <span className="mr-1.5 font-bold">
                            (الفرق: {adv.differenceAmount > 0 ? `يرجع للشركة ${adv.differenceAmount} ر.س` : `يصرف لك ${Math.abs(adv.differenceAmount)} ر.س`})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clearance Advance Modal */}
          {activeAdvanceToClear && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setActiveAdvanceToClear(null)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <span>تصفية عهدة بمبلغ: {activeAdvanceToClear.amount} ر.س</span>
                </h3>

                <form onSubmit={handleClearAdvanceSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الفاتورة الرسمية</label>
                      <input
                        type="text"
                        required
                        placeholder="INV-2026-909"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200 text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المبلغ المصروف الفعلي (ر.س)</label>
                      <input
                        type="number"
                        required
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200 text-right"
                      />
                    </div>
                  </div>

                  {/* dynamic difference calc display */}
                  <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-right flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">حساب الفروقات المالية للتصفية:</span>
                    <strong className={activeAdvanceToClear.amount - invoiceAmount >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                      {activeAdvanceToClear.amount - invoiceAmount >= 0 
                        ? `ترجع للشركة: ${activeAdvanceToClear.amount - invoiceAmount} ر.س` 
                        : `تستحق صرف إضافي: ${Math.abs(activeAdvanceToClear.amount - invoiceAmount)} ر.س`}
                    </strong>
                  </div>

                  <FileUpload 
                    label="تصوير وإرفاق الفاتورة مباشرة من الكاميرا" 
                    previewImage={invoicePhoto}
                    onUpload={(url) => setInvoicePhoto(url)} 
                  />

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 font-bold text-xs py-2.5 rounded-xl text-slate-900 bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                    >
                      تقديم التصفية للمطابقة والاعتماد
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAdvanceToClear(null)}
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

      {/* --- ASSETS VIEW --- */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">العهد العينية والأدوات المستلمة لك</h2>
            <p className="text-xs text-slate-400">تابع الأدوات والمعدات المسلمة لعهدتك الشخصية من مستودع الشركة، وافحصها أو أبلغ عن التلف فوراً</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myAssets.map(asset => (
              <div key={asset.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-1.5 mb-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    <StatusBadge status={asset.status} />
                  </div>

                  <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{asset.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">S/N: {asset.serialNumber}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-3">
                  <span className="text-[10px] text-slate-400">تاريخ الاستلام: {asset.assignedDate}</span>
                  {asset.status === 'assigned' && (
                    <button
                      onClick={() => handleReportAssetDamage(asset.id)}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      إبلاغ عن عطل أو تلف الأداة
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DAILY REPORT VIEW --- */}
      {activeTab === 'daily_reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 h-fit">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-blue-500" />
                <span>رفع التقرير اليومي العام للعمل</span>
              </div>

              <form onSubmit={handleSubmitGeneralReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">عدد ساعات العمل الفعلي اليوم</label>
                  <input
                    type="number"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ماذا تم إنجازه بالتفصيل؟</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="اكتب الأعمال التفصيلية والمشاريع التي تمت مباشرتها..."
                    value={accomplished}
                    onChange={(e) => setAccomplished(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">مشاكل وعوائق واجهتك اليوم (إن وجد)</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب المعوقات أو الاحتياجات التي تسببت بتأخيرك..."
                    value={problems}
                    onChange={(e) => setProblems(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer ${primaryBg}`}
                >
                  رفع التقرير اليومي للإدارة
                </button>
              </form>
            </div>

            {/* list of past reports */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">سجل التقارير اليومية التي قمت برفعها</div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dailyReports.map(rep => (
                  <div key={rep.id} className="py-3 space-y-1 text-right">
                    <div className="flex justify-between items-center">
                      <strong className="text-xs text-slate-800 dark:text-slate-200">تاريخ التقرير: {rep.date}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">عدد ساعات العمل: {rep.hoursWorked}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rep.accomplished}</p>
                    {rep.problems && (
                      <p className="text-[11px] bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 p-2 rounded-lg mt-1.5">
                        <strong>عوائق الموقع:</strong> {rep.problems}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
