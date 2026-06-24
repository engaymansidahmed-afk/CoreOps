/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CashAdvance, Project, ClearanceInvoice, Employee, Task } from '../types';
import { StatusBadge } from './SharedComponents';
import { useAppTheme } from './ThemeContext';
import { DollarSign, Wallet, FileSpreadsheet, Check, Eye, X, BarChart, TrendingUp, AlertCircle, Printer, Download, MessageSquare } from 'lucide-react';
import { ChatCenter } from './ChatCenter';

interface AccountantPanelProps {
  currentUser: Employee;
  employees: Employee[];
  tasks: Task[];
  advances: CashAdvance[];
  setAdvances: React.Dispatch<React.SetStateAction<CashAdvance[]>>;
  projects: Project[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AccountantPanel: React.FC<AccountantPanelProps> = ({
  currentUser,
  employees,
  tasks,
  advances,
  setAdvances,
  projects,
  onShowToast
}) => {
  const { primaryBg, primaryText, primaryLightBg, badgeBg, badgeText } = useAppTheme();
  
  // Tabs: pending_payments, audit_clearances, financial_ledger, chat
  const [activeTab, setActiveTab] = useState<'pending_payments' | 'audit_clearances' | 'financial_ledger' | 'chat'>('pending_payments');
  
  // Selected invoice preview state
  const [activeInvoicePreview, setActiveInvoicePreview] = useState<ClearanceInvoice | null>(null);

  // Financial calculations
  const totalAdvancesPendingRelease = advances.filter(a => a.status === 'pending_accountant').length;
  const totalClearancesPendingAudit = advances.filter(a => a.status === 'approved' && a.clearanceInvoices.length > 0).length;

  const totalCapitalProjects = projects.reduce((sum, p) => sum + p.budget, 0);
  
  // Accumulated invoices total
  const totalInvoicedSpent = advances.reduce((sum, a) => {
    return sum + a.clearanceInvoices.reduce((s, i) => s + i.amount, 0);
  }, 0);

  // Total cash advances currently floating in field
  const totalFloatingCash = advances
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.amount, 0);

  // Handlers
  const handleReleaseFunds = (id: string) => {
    setAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        onShowToast(`✓ تم قيد العملية بنجاح وصرف مبلغ ${adv.amount} ريال للمستفيد ماليًا`, 'success');
        return { ...adv, status: 'approved' };
      }
      return adv;
    }));
  };

  const handleAuditClearance = (id: string) => {
    setAdvances(prev => prev.map(adv => {
      if (adv.id === id) {
        onShowToast('✓ تم تدقيق وإغلاق تصفية العهدة المالية بنجاح بالدفتر المحاسبي', 'success');
        return { ...adv, status: 'cleared' };
      }
      return adv;
    }));
  };

  // Extract all invoices from advances
  const allClearanceInvoices: Array<{ advId: string; employeeName: string; inv: ClearanceInvoice }> = [];
  advances.forEach(adv => {
    adv.clearanceInvoices.forEach(inv => {
      allClearanceInvoices.push({
        advId: adv.id,
        employeeName: adv.employeeName,
        inv
      });
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" style={{ direction: 'rtl' }}>
      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('pending_payments')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'pending_payments' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Wallet className="w-4 h-4" />
          <span>اعتماد وصرف مالي للعهد ({totalAdvancesPendingRelease})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_clearances')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'audit_clearances' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>تدقيق الفواتير والتصفيات الميدانية</span>
        </button>

        <button
          onClick={() => setActiveTab('financial_ledger')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'financial_ledger' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <BarChart className="w-4 h-4" />
          <span>القوائم المالية والتحليل</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'chat' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>مركز التواصل والتعاون</span>
        </button>
      </div>

      {/* --- PENDING PAYMENTS TAB --- */}
      {activeTab === 'pending_payments' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تحويل وصرف العهد المعتمدة إدارياً</h2>
            <p className="text-xs text-slate-400">صرف وإعطاء التدفق المالي للمشتريات الميدانية الطارئة للمهندسين والمقاولين</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              طلبات الصرف المالي بانتظار تحويل المحاسب
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {advances.filter(a => a.status === 'pending_accountant').length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">لا توجد طلبات صرف مالي بانتظارك حالياً.</div>
              ) : (
                advances.filter(a => a.status === 'pending_accountant').map(adv => (
                  <div key={adv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1 text-right">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{adv.employeeName}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2.5 py-0.5 rounded font-bold">معتمد إدارياً</span>
                        <span className="text-[10px] text-slate-400 font-mono">{adv.requestDate}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">{adv.reason}</p>
                    </div>

                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">المبلغ المطلوب صرفه</span>
                        <strong className="text-base font-sans font-extrabold text-slate-800 dark:text-slate-100">{adv.amount} ر.س</strong>
                      </div>

                      <button
                        onClick={() => handleReleaseFunds(adv.id)}
                        className={`text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-colors cursor-pointer ${primaryBg}`}
                      >
                        قيد وإطلاق الصرف المالي
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- AUDIT CLEARANCES TAB --- */}
      {activeTab === 'audit_clearances' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تدقيق الفواتير والمستندات المرفوعة للتصفية</h2>
            <p className="text-xs text-slate-400">مطابقة الفواتير الرسمية بقيمة العهد المصروفة، وإجراء التسويات المالية وإقفال الحسابات</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* clearances listing */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                  الفواتير والمصاريف بانتظار التدقيق المحاسبي والإغلاق
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {advances.filter(a => a.status === 'approved' && a.clearanceInvoices.length > 0).length === 0 ? (
                    <div className="text-center py-16 text-slate-400 text-xs">لا توجد تسويات مالية أو فواتير تحت التدقيق حالياً.</div>
                  ) : (
                    advances.filter(a => a.status === 'approved' && a.clearanceInvoices.length > 0).map(adv => {
                      const inv = adv.clearanceInvoices[0];
                      const diff = adv.amount - inv.amount;
                      return (
                        <div key={adv.id} className="p-4 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <strong className="text-xs text-slate-800 dark:text-slate-200">{adv.employeeName}</strong>
                              <p className="text-[10px] text-slate-400 mt-0.5">صرف عهدة: {adv.amount} ر.س • قيمة الفاتورة: {inv.amount} ر.س</p>
                            </div>
                            <button
                              onClick={() => setActiveInvoicePreview(inv)}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض وتكبير صورة الفاتورة</span>
                            </button>
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                            الفاتورة رقم: <strong className="font-mono text-slate-800 dark:text-slate-100">{inv.invoiceNumber}</strong> ({inv.category}) • {inv.notes || 'لا توجد ملاحظات إضافية'}
                          </div>

                          {/* settlement and action */}
                          <div className="flex items-center justify-between gap-4 pt-1.5 flex-wrap">
                            <span className={`text-[11px] font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {diff >= 0 
                                ? `✓ تسوية: يرجع للشركة مبلغ ${diff} ر.س` 
                                : `✓ تسوية: يصرف للموظف مبلغ تعويضي ${Math.abs(diff)} ر.س`}
                            </span>

                            <button
                              onClick={() => handleAuditClearance(adv.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-4 py-2 rounded-lg shadow-sm cursor-pointer"
                            >
                              اعتماد التسوية وإغلاق العهدة
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Invoices register history */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                أحدث الفواتير المسجلة والمقفلة بالدفاتر
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {allClearanceInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">لا يوجد فواتير مسجلة تاريخياً.</div>
                ) : (
                  allClearanceInvoices.map(item => (
                    <div key={item.inv.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-slate-800 dark:text-slate-200">فواتير {item.employeeName}</strong>
                        <span className="font-mono font-bold text-emerald-600">{item.inv.amount} ر.س</span>
                      </div>
                      <p className="text-[10px] text-slate-400">الفاتورة: {item.inv.invoiceNumber} • {item.inv.category}</p>
                      <button
                        onClick={() => setActiveInvoicePreview(item.inv)}
                        className="text-[9px] text-blue-500 hover:underline mt-1 block cursor-pointer"
                      >
                        مشاهدة الفاتورة
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Image Invoice Viewer overlay modal */}
          {activeInvoicePreview && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setActiveInvoicePreview(null)}
                  className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                  مستند الفاتورة رقم: {activeInvoicePreview.invoiceNumber}
                </h3>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-4 bg-slate-50 dark:bg-slate-950/40">
                  <img 
                    src={activeInvoicePreview.photo} 
                    alt="Invoice receipt" 
                    className="max-h-[300px] w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>قيمة الفاتورة المعتمدة: <strong>{activeInvoicePreview.amount} ر.س</strong></p>
                  <p>الفئة والتصنيف: <strong>{activeInvoicePreview.category}</strong></p>
                  {activeInvoicePreview.notes && <p>ملاحظات إضافية: <strong>{activeInvoicePreview.notes}</strong></p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- FINANCIAL LEDGER TAB --- */}
      {activeTab === 'financial_ledger' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">القوائم المالية والتحليل العام للتدفق المالي</h2>
            <p className="text-xs text-slate-400">دفتر الأستاذ والبيانات المالية التراكمية لمشاريع ومصروفات الشركة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 block font-bold">رأس مال المشاريع الكلي (الإيراد)</p>
              <h3 className="text-xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 font-sans mt-1">
                {totalCapitalProjects.toLocaleString()} ر.س
              </h3>
              <span className="text-[9px] text-slate-400 block mt-1">من {projects.length} مشاريع متعاقد عليها</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 block font-bold">المصروفات الفعلية بموجب الفواتير</p>
              <h3 className="text-xl md:text-3xl font-extrabold text-rose-500 font-sans mt-1">
                {totalInvoicedSpent.toLocaleString()} ر.س
              </h3>
              <span className="text-[9px] text-slate-400 block mt-1">تمت مراجعتها وتدقيق فواتيرها كاملة</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <p className="text-[10px] text-slate-400 block font-bold">السيولة النقدية العائمة بالميدان</p>
              <h3 className="text-xl md:text-3xl font-extrabold text-amber-500 font-sans mt-1">
                {totalFloatingCash.toLocaleString()} ر.s
              </h3>
              <span className="text-[9px] text-slate-400 block mt-1">بعهدة المهندسين وتنتظر رفع فواتير التصفية</span>
            </div>
          </div>
        </div>
      )}

      {/* --- COLLABORATION & COMMUNICATION CENTER TAB --- */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm h-[750px]">
          <ChatCenter 
            currentUser={currentUser} 
            employees={employees}
            projects={projects}
            tasks={tasks}
            onShowToast={onShowToast}
          />
        </div>
      )}
    </div>
  );
};
