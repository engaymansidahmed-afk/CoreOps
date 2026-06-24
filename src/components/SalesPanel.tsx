/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lead, Employee, Task, Project } from '../types';
import { StatusBadge, GPSMap } from './SharedComponents';
import { useAppTheme } from './ThemeContext';
import { Plus, Users, MapPin, Phone, Briefcase, Share2, DollarSign, Send, FileText, ChevronLeft, BarChart3, TrendingUp, Compass, Check, X, Sparkles, MessageSquare } from 'lucide-react';
import { ChatCenter } from './ChatCenter';

interface SalesPanelProps {
  currentUser: Employee;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  employees: Employee[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SalesPanel: React.FC<SalesPanelProps> = ({
  currentUser,
  leads, setLeads,
  employees,
  tasks, setTasks,
  projects, setProjects,
  onShowToast
}) => {
  const { primaryBg, primaryText, primaryLightBg, badgeBg, badgeText } = useAppTheme();
  
  // Tabs: leads_list, new_lead_form, leads_map, sales_analytics, chat
  const [activeTab, setActiveTab] = useState<'leads_list' | 'new_lead_form' | 'leads_map' | 'sales_analytics' | 'chat'>('leads_list');

  // New Lead Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [serviceType, setServiceType] = useState<'alarm' | 'firefighting' | 'generators' | 'maintenance'>('alarm');
  const [description, setDescription] = useState('');

  // Magical Dispatch (Assign) State
  const [activeLeadToAssign, setActiveLeadToAssign] = useState<Lead | null>(null);
  const [assignedEngineerId, setAssignedEngineerId] = useState('');

  // Quotation Creator State
  const [activeLeadForQuote, setActiveLeadForQuote] = useState<Lead | null>(null);
  const [quoteAmount, setQuoteAmount] = useState(2500);
  const [quoteNotes, setQuoteNotes] = useState('');

  // Handlers
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !locationName) {
      onShowToast('الرجاء كتابة اسم العميل، جواله، ووصف الموقع', 'error');
      return;
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      clientName,
      phone: clientPhone,
      locationName,
      latitude: 24.65 + (Math.random() * 0.15), // Random Riyadh area
      longitude: 46.65 + (Math.random() * 0.15),
      serviceType,
      description,
      status: 'new_lead',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setLeads(prev => [newLead, ...prev]);
    onShowToast(`✓ تم تسجيل العميل المحتمل "${clientName}" بنجاح في نظام المبيعات`, 'success');
    
    // Clear state
    setClientName('');
    setClientPhone('');
    setLocationName('');
    setDescription('');
    
    // Go to list
    setActiveTab('leads_list');
  };

  // MAGICAL DISPATCH: Lead -> Task Flow
  const handleDispatchToEngineer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadToAssign || !assignedEngineerId) return;

    const engineer = employees.find(emp => emp.id === assignedEngineerId);
    if (!engineer) return;

    // 1. Update Lead Status
    setLeads(prev => prev.map(l => {
      if (l.id === activeLeadToAssign.id) {
        return {
          ...l,
          status: 'assigned',
          assignedToEmployeeId: assignedEngineerId,
          assignedToEmployeeName: engineer.name
        };
      }
      return l;
    }));

    // 2. Automatically Create a Task for this Engineer
    const serviceLabel = 
      activeLeadToAssign.serviceType === 'alarm' ? '🚨 معاينة نظام إنذار الحريق' :
      activeLeadToAssign.serviceType === 'firefighting' ? '🔥 معاينة شبكة مكافحة الحريق الرطبة' :
      activeLeadToAssign.serviceType === 'generators' ? '⚡ صيانة ومعاينة المولد الكهربائي' : '⚙️ معاينة تشغيل وصيانة عامة';

    const newTask: Task = {
      id: `task-${Date.now()}`,
      projectId: 'proj-temp', // Link to temporary project or lead project
      projectName: `معاينة: ${activeLeadToAssign.clientName}`,
      assignedEmployeeId: assignedEngineerId,
      assignedEmployeeName: engineer.name,
      title: `${serviceLabel} - معاينة أولية للموقع والمساحة`,
      description: `العميل يطلب المعاينة الفنية وإعداد تقرير المتطلبات وعرض السعر. تفاصيل الطلب: ${activeLeadToAssign.description}. العنوان: ${activeLeadToAssign.locationName}`,
      priority: 'medium',
      status: 'pending',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +3 days
    };

    setTasks(prev => [newTask, ...prev]);
    onShowToast(`⚡ تم التوجيه التلقائي للمهمة وتكليف المهندس ${engineer.name} بالمعاينة الفورية`, 'success');

    setActiveLeadToAssign(null);
    setAssignedEngineerId('');
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadForQuote) return;

    setLeads(prev => prev.map(l => {
      if (l.id === activeLeadForQuote.id) {
        return {
          ...l,
          status: 'quotation',
          quotationAmount: Number(quoteAmount),
          quotationNotes: quoteNotes
        };
      }
      return l;
    }));

    // Optionally create a Project if quotation is high and accepted, let's just make a beautiful notice
    onShowToast(`✓ تم إنشاء عرض السعر بقيمة ${quoteAmount} ريال وإرساله بنجاح للعميل`, 'success');

    setActiveLeadForQuote(null);
    setQuoteAmount(2500);
    setQuoteNotes('');
  };

  // Conversion statistics
  const totalLeads = leads.length;
  const assignedLeads = leads.filter(l => l.status === 'assigned' || l.status === 'inspection').length;
  const quotationLeads = leads.filter(l => l.status === 'quotation').length;
  const completedProjectsCount = leads.filter(l => l.status === 'completed').length;
  
  const conversionRate = totalLeads > 0 ? Math.round(((completedProjectsCount + quotationLeads) / totalLeads) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6" style={{ direction: 'rtl' }}>
      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
        <button
          onClick={() => setActiveTab('leads_list')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'leads_list' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Users className="w-4 h-4" />
          <span>العملاء المحتملون ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('new_lead_form')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'new_lead_form' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>

        <button
          onClick={() => setActiveTab('leads_map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'leads_map' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <Compass className="w-4 h-4" />
          <span>خريطة رصد العملاء</span>
        </button>

        <button
          onClick={() => setActiveTab('sales_analytics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'sales_analytics' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>تحليل أداء المبيعات</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${activeTab === 'chat' ? `${primaryBg} text-white shadow-md` : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>مركز التواصل والتعاون</span>
        </button>
      </div>

      {/* --- LEADS LIST VIEW --- */}
      {activeTab === 'leads_list' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">سجل العملاء وإسناد طلبات الصيانة المباشرة</h2>
            <p className="text-xs text-slate-400">توجيه طلبات العملاء فورياً للفنيين المختصين لسرعة المعاينة وتجهيز عروض الأسعار</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {leads.map(lead => (
              <div key={lead.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded">
                      {lead.serviceType === 'alarm' ? '🚨 إنذار حريق' : lead.serviceType === 'firefighting' ? '🔥 مكافحة حريق' : lead.serviceType === 'generators' ? '⚡ مولدات' : '⚙️ صيانة عامة'}
                    </span>
                    <StatusBadge status={lead.status} />
                  </div>

                  <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 mb-1.5">{lead.clientName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lead.locationName}</span>
                  </p>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-4">{lead.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs flex-wrap gap-2">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-mono">{lead.phone}</span>
                  </span>

                  {/* Dispatch workflow trigger button */}
                  {lead.status === 'new_lead' && (
                    <button
                      onClick={() => setActiveLeadToAssign(lead)}
                      className={`flex items-center gap-1 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer ${primaryBg}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>إسناد الطلب للمهندس المختص</span>
                    </button>
                  )}

                  {lead.status === 'assigned' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveLeadForQuote(lead)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 inline mr-0.5" />
                        <span>إرسال عرض سعر</span>
                      </button>
                      
                      <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                        متابع لـ: {lead.assignedToEmployeeName}
                      </span>
                    </div>
                  )}

                  {lead.status === 'quotation' && (
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      عرض السعر المقدم: <strong className="text-emerald-600 font-extrabold">{lead.quotationAmount?.toLocaleString()} ر.س</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dispatch Lead Modal */}
          {activeLeadToAssign && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setActiveLeadToAssign(null)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <Send className="w-5 h-5 text-blue-500" />
                  <span>توجيه العميل للمختص الفني</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">اختر أحد المهندسين المتواجدين بالرياض لمعاينة الموقع وتأكيد تلبية المتطلبات</p>

                <form onSubmit={handleDispatchToEngineer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم العميل ومطلبه</label>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                      <strong>{activeLeadToAssign.clientName}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المهندس الميداني المسؤول عن المعاينة</label>
                    <select
                      value={assignedEngineerId}
                      required
                      onChange={(e) => setAssignedEngineerId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    >
                      <option value="">-- اختر مهندس / فني --</option>
                      {employees.filter(e => e.role === 'engineer').map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className={`flex-1 font-bold text-xs py-2.5 rounded-xl text-white shadow-md cursor-pointer ${primaryBg}`}
                    >
                      تأكيد توجيه الطلب
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLeadToAssign(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Quotation Creator Modal */}
          {activeLeadForQuote && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative text-right">
                <button
                  onClick={() => setActiveLeadForQuote(null)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>تجهيز عرض السعر للعميل</span>
                </h3>
                <p className="text-xs text-slate-400 mb-4">إنشاء العرض بموجب تقرير المعاينة الفنية المرفوعة</p>

                <form onSubmit={handleCreateQuotation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">القيمة التقديرية لعرض السعر (ر.س)</label>
                    <input
                      type="number"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">بنود العرض أو شروطه</label>
                    <textarea
                      rows={3}
                      placeholder="اكتب تفاصيل البنود والمدة المستغرقة..."
                      value={quoteNotes}
                      onChange={(e) => setQuoteNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 font-bold text-xs py-2.5 rounded-xl text-slate-900 bg-amber-500 hover:bg-amber-600 shadow-md cursor-pointer"
                    >
                      إرسال عرض السعر المالي
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveLeadForQuote(null)}
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

      {/* --- NEW LEAD FORM VIEW --- */}
      {activeTab === 'new_lead_form' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تسجيل وتدوين عميل محتمل جديد</h2>
            <p className="text-xs text-slate-400">دون متطلبات وموقع العميل تمهيداً لتكليف الفني بالمعاينة الهندسية الفورية</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm max-w-xl mx-auto text-right">
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم العميل (الجهة / الشركة / الفرد)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة الراجحي للمقاولات المحدودة"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الجوال والاتصال</label>
                  <input
                    type="tel"
                    required
                    placeholder="مثال: +966 50 123 4567"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-left font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نوع الخدمة الفنية المطلوبة</label>
                  <select
                    value={serviceType}
                    onChange={(e: any) => setServiceType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                  >
                    <option value="alarm">إنذار حريق</option>
                    <option value="firefighting">مكافحة وإطفاء حريق</option>
                    <option value="generators">مولدات كهربائية</option>
                    <option value="maintenance">عقود صيانة وتشغيل سنوية</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">عنوان الموقع ووصفه الجغرافي</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حي العليا، خلف مكتبة جرير، الرياض"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">توصيف احتياج العميل بالتفصيل</label>
                <textarea
                  rows={3}
                  placeholder="مثال: العميل يريد تركيب وتصميم نظام رشاشات مائية كامل بالصالة الرئيسية وتوريد مضخة جديدة"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200 text-right"
                />
              </div>

              {/* simulated notice */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-[10px] text-slate-500 text-right">
                💡 سيقوم النظام تلقائياً برصد إحداثيات الموقع وتحديدها على رادار خريطة المبيعات لإمكانية الفرز والتسويق وتوجيه الفني الأقرب.
              </div>

              <button
                type="submit"
                className={`w-full text-white font-bold text-xs py-2.5 rounded-xl shadow cursor-pointer ${primaryBg}`}
              >
                حفظ وتسجيل بيانات العميل
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- LEADS MAP VIEW --- */}
      {activeTab === 'leads_map' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">رادار خريطة العملاء والمندوبين</h2>
            <p className="text-xs text-slate-400">تتبع مواقع العملاء المحتملين لجدولة زيارات المعاينة الجغرافية الكفؤة</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
            <GPSMap 
              pins={leads.map(lead => ({
                id: lead.id,
                name: lead.clientName,
                lat: lead.latitude,
                lng: lead.longitude,
                type: 'lead'
              }))}
            />
          </div>
        </div>
      )}

      {/* --- SALES ANALYTICS VIEW --- */}
      {activeTab === 'sales_analytics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-100">تحليلات المبيعات وأداء التحويل التكتيكي</h2>
            <p className="text-xs text-slate-400">مراقبة معدل تحويل العملاء من تسويق إلى مهام فنية منجزة وعقود معتمدة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي العملاء المسجلين</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{totalLeads} عملاء</h3>
              <span className="text-[9px] text-slate-400 block mt-1">تحديث حي من النظام الميداني</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-400 block font-bold">العملاء قيد المعاينة والإسناد</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-blue-600 mt-1">{assignedLeads} عملاء</h3>
              <span className="text-[9px] text-slate-400 block mt-1">يتولى الفنيون المعاينة الموقعية لهم</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <span className="text-[10px] text-slate-400 block font-bold">معدل نجاح إقفال الصفقات</span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600 font-sans mt-1">{conversionRate}%</h3>
              <span className="text-[9px] text-slate-400 block mt-1">التحويل من Leads إلى عروض أسعار ومشاريع منفذة</span>
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
