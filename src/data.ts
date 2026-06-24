/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Employee, Task, CashAdvance, Asset, Lead, DailyReport, AttendanceLog, SystemNotification, UserSettings } from './types';
import { hashPassword } from './lib/crypto';

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'م / أيمن',
    code: '1',
    role: 'admin',
    email: 'ayman@coreops.sa',
    phone: '+966 50 111 2222',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    passwordHash: hashPassword('GCC'),
    mustChangePassword: false
  },
  {
    id: 'emp-1000',
    name: 'أ. سارة القحطاني',
    code: '1000',
    role: 'admin',
    email: 'sara@coreops.sa',
    phone: '+966 50 123 4567',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop',
    passwordHash: hashPassword('1000'),
    mustChangePassword: true
  },
  {
    id: 'emp-1001',
    name: 'م. أحمد الحربي',
    code: '1001',
    role: 'engineer',
    email: 'ahmed@coreops.sa',
    phone: '+966 55 987 6543',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    passwordHash: hashPassword('1001'),
    mustChangePassword: true
  },
  {
    id: 'emp-1002',
    name: 'أ. خالد الدوسري',
    code: '1002',
    role: 'accountant',
    email: 'khaled@coreops.sa',
    phone: '+966 54 555 4433',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop',
    passwordHash: hashPassword('1002'),
    mustChangePassword: true
  },
  {
    id: 'emp-1003',
    name: 'أ. فهد الشمري',
    code: '1003',
    role: 'sales',
    email: 'fahad@coreops.sa',
    phone: '+966 56 111 2233',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop',
    passwordHash: hashPassword('1003'),
    mustChangePassword: true
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'مشروع مستودعات السلي اللوجستية',
    location: 'حي السلي، الرياض',
    latitude: 24.6934,
    longitude: 46.8286,
    type: 'firefighting',
    status: 'active',
    startDate: '2026-01-10',
    endDate: '2026-12-15',
    budget: 450000,
    clientName: 'شركة مخازن الشرق المحدودة'
  },
  {
    id: 'proj-2',
    name: 'برج الفيصلية - صيانة المولدات الاحتياطية',
    location: 'حي العليا، الرياض',
    latitude: 24.6903,
    longitude: 46.6842,
    type: 'generators',
    status: 'active',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    budget: 185000,
    clientName: 'مجموعة الفيصلية القابضة'
  },
  {
    id: 'proj-3',
    name: 'مستشفى الدكتور سليمان الحبيب - تركيب نظام الإنذار',
    location: 'طريق خريص، الرياض',
    latitude: 24.7073,
    longitude: 46.7412,
    type: 'alarm',
    status: 'active',
    startDate: '2026-05-15',
    endDate: '2026-11-20',
    budget: 320000,
    clientName: 'مجموعة سليمان الحبيب الطبية'
  },
  {
    id: 'proj-4',
    name: 'الرياض بارك مول - فحص أنظمة السلامة المتكاملة',
    location: 'طريق الدائري الشمالي، الرياض',
    latitude: 24.7562,
    longitude: 46.6300,
    type: 'maintenance',
    status: 'completed',
    startDate: '2026-04-01',
    endDate: '2026-06-15',
    budget: 95000,
    clientName: 'شركة الهامات العقارية'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    projectId: 'proj-1',
    projectName: 'مشروع مستودعات السلي اللوجستية',
    assignedEmployeeId: 'emp-1001',
    assignedEmployeeName: 'م. أحمد الحربي',
    title: 'فحص واختبار ضغط شبكة مياه الإطفاء الرطبة',
    description: 'إجراء فحص ضغط الأنابيب لشبكة مياه الإطفاء في المستودع رقم 3 وتأكيد تحملها لـ 15 بار لمدة ساعتين متواصلتين مع تصوير العدادات.',
    priority: 'high',
    status: 'in_progress',
    startDate: '2026-06-20',
    endDate: '2026-06-25'
  },
  {
    id: 'task-2',
    projectId: 'proj-2',
    projectName: 'برج الفيصلية - صيانة المولدات الاحتياطية',
    assignedEmployeeId: 'emp-1001',
    assignedEmployeeName: 'م. أحمد الحربي',
    title: 'تغيير فلاتر الديزل وفحص بطاريات بدء التشغيل',
    description: 'استبدال فلاتر الوقود والزيت للمولد الرئيسي رقم 2 في قبو البرج وإجراء فحص جهد بطاريات التشغيل وتعبئة سائل البطارية.',
    priority: 'medium',
    status: 'pending',
    startDate: '2026-06-26',
    endDate: '2026-06-28'
  },
  {
    id: 'task-3',
    projectId: 'proj-3',
    projectName: 'مستشفى الدكتور سليمان الحبيب - تركيب نظام الإنذار',
    assignedEmployeeId: 'emp-1001',
    assignedEmployeeName: 'م. أحمد الحربي',
    title: 'برمجة لوحة التحكم الرئيسية لنظام كواشف الدخان والحرارة',
    description: 'توصيل اللوحة الرئيسية وبرمجة العناوين (Addresses) للغرف الـ 50 في الطابق الثاني من البرج الطبي الجديد مع اختبار الربط بالجوال.',
    priority: 'high',
    status: 'pending',
    startDate: '2026-07-01',
    endDate: '2026-07-04'
  },
  {
    id: 'task-4',
    projectId: 'proj-4',
    projectName: 'الرياض بارك مول - فحص أنظمة السلامة المتكاملة',
    assignedEmployeeId: 'emp-1001',
    assignedEmployeeName: 'م. أحمد الحربي',
    title: 'المعاينة السنوية الشاملة واستصدار شهادة إتمام الفحص التكتيكي',
    description: 'فحص كفاءة مضخات الإطفاء ومخارج الطوارئ وشهادة المعاينة المعتمدة للدفاع المدني بموجب المتطلبات الفنية للعام الجاري.',
    priority: 'medium',
    status: 'done',
    startDate: '2026-06-01',
    endDate: '2026-06-12',
    beforePhoto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?q=80&w=400&auto=format&fit=crop',
    afterPhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop',
    reportText: 'تمت معاينة جميع المضخات وتأكيد سلامة التشغيل الآلي واليدوي، وتحديث كواشف الدخان في جميع الممرات الرئيسية والفرعية، والتوقيع من ممثل إدارة السلامة بالمجمع المالي للمركز التجاري.',
    clientSignature: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Signature_of_Sarah_Bernhardt_1891.svg',
    reportDate: '2026-06-12'
  }
];

export const INITIAL_ADVANCES: CashAdvance[] = [
  {
    id: 'adv-1',
    employeeId: 'emp-1001',
    employeeName: 'م. أحمد الحربي',
    amount: 1500,
    reason: 'شراء كوابل تمديدات مقاومة للحرارة (UL Listed) ومفاتيح طوارئ إضافية لإنهاء صيانة مستودع السلي بشكل عاجل.',
    status: 'pending_admin',
    requestDate: '2026-06-23',
    clearanceInvoices: []
  },
  {
    id: 'adv-2',
    employeeId: 'emp-1001',
    employeeName: 'م. أحمد الحربي',
    amount: 800,
    reason: 'شراء صمامات أمان إضافية لشبكة الإطفاء ومستلزمات لحام نحاسية طارئة.',
    status: 'cleared',
    requestDate: '2026-06-10',
    approvalDate: '2026-06-10',
    clearanceDate: '2026-06-14',
    clearanceInvoices: [
      {
        id: 'inv-1',
        amount: 720,
        invoiceNumber: 'INV-2026-9091',
        photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=300&auto=format&fit=crop',
        category: 'معدات ومستلزمات ربط',
        date: '2026-06-13',
        notes: 'مشتريات من محلات عالم السلامة للصناعة بالملز بموجب الفاتورة الرسمية المبسطة.'
      }
    ],
    differenceAmount: 80 // 800 - 720 = 80 SAR to be returned to the company
  }
];

export const INITIAL_ASSETS: Asset[] = [
  {
    id: 'asset-1',
    name: 'مقياس تدفق المياه المحمول (Water Flow Meter)',
    serialNumber: 'FM-9981-XP',
    category: 'أجهزة قياس وفحص',
    status: 'assigned',
    assignedToEmployeeId: 'emp-1001',
    assignedToEmployeeName: 'م. أحمد الحربي',
    assignedDate: '2026-02-15'
  },
  {
    id: 'asset-2',
    name: 'جهاز اختبار كواشف الدخان الحراري الذكي (Smoke Detector Tester)',
    serialNumber: 'SDT-7722-V',
    category: 'معدات اختبار السلامة',
    status: 'assigned',
    assignedToEmployeeId: 'emp-1001',
    assignedToEmployeeName: 'م. أحمد الحربي',
    assignedDate: '2026-03-10'
  },
  {
    id: 'asset-3',
    name: 'مضخة اختبار ضغط المياه الهيدروليكية يدوية',
    serialNumber: 'HP-50-BAR',
    category: 'معدات هيدروليكية',
    status: 'available'
  },
  {
    id: 'asset-4',
    name: 'جهاز كاشف دخان لاسلكي هانيويل للتجربة والعرض',
    serialNumber: 'HW-SD-098',
    category: 'أجهزة عرض وعينات تسويقية',
    status: 'assigned',
    assignedToEmployeeId: 'emp-1003',
    assignedToEmployeeName: 'أ. فهد الشمري',
    assignedDate: '2026-05-01'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    clientName: 'شركة مصنع الجزيرة للبلاستيك والمطاط',
    phone: '+966 50 444 8899',
    locationName: 'المدينة الصناعية الثانية، الرياض',
    latitude: 24.5812,
    longitude: 46.8402,
    serviceType: 'firefighting',
    description: 'العميل لديه توسعة في صالة الإنتاج رقم 3 بمساحة 2500 متر مربع ويحتاج لتركيب شبكة إطفاء متكاملة بالرشاشات المائية المرتبطة بالمضخة الرئيسية وتحديث الترخيص.',
    status: 'new_lead',
    createdDate: '2026-06-22'
  },
  {
    id: 'lead-2',
    clientName: 'مجمع نجد الطبي لطب الأسنان',
    phone: '+966 55 222 3344',
    locationName: 'حي الياسمين، طريق الملك عبدالعزيز، الرياض',
    latitude: 24.8115,
    longitude: 46.6434,
    serviceType: 'alarm',
    description: 'تركيب نظام كواشف حريق حرارية في عيادات وغرف الأشعة والمكاتب الإدارية مع ربطه بلوحة إنذار تحذيرية صامتة ولوحة تحكم ذكية.',
    status: 'assigned',
    assignedToEmployeeId: 'emp-1001',
    assignedToEmployeeName: 'م. أحمد الحربي',
    createdDate: '2026-06-21'
  },
  {
    id: 'lead-3',
    clientName: 'فندق ميركيور الرياض للشقق الفندقية',
    phone: '+966 54 888 1122',
    locationName: 'حي الصحافة، الرياض',
    latitude: 24.7932,
    longitude: 46.6294,
    serviceType: 'generators',
    description: 'طلب معاينة طارئة للمولد الكهربائي الاحتياطي (كوبوتا 150 كيلو فولت أمبير) لوجود تهريب ديزل وخلل في لوحة التحكم الأوتوماتيكية ATS.',
    status: 'inspection',
    assignedToEmployeeId: 'emp-1001',
    assignedToEmployeeName: 'م. أحمد الحربي',
    createdDate: '2026-06-20',
    quotationAmount: 3200,
    quotationNotes: 'رسوم المعاينة الأولية مع إصلاح تهريب الديزل وتعديل أسلاك لوحة الـ ATS.'
  }
];

export const INITIAL_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'rep-1',
    employeeId: 'emp-1001',
    employeeName: 'م. أحمد الحربي',
    date: '2026-06-23',
    hoursWorked: 8,
    accomplished: 'تم الانتهاء من فحص ضغط المياه في الأنابيب العلوية لمستودع السلي اللوجستي رقم 3، وتم تركيب 14 رأس رشاش مائي جديد في الصالة الشرقية.',
    problems: 'واجهنا انخفاضاً طفيفاً في ضغط الماء في البداية بسبب تسريب بسيط في صمام التفريغ الجانبي، وتم معالجته بإعادة شد وتركيب شريط التفلون العازل.',
    beforePhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=200&auto=format&fit=crop',
    afterPhoto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?q=80&w=200&auto=format&fit=crop'
  }
];

export const INITIAL_ATTENDANCE: AttendanceLog[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1001',
    employeeName: 'م. أحمد الحربي',
    date: '2026-06-23',
    checkInTime: '07:45',
    checkOutTime: '17:15',
    checkInLat: 24.6934,
    checkInLng: 46.8286,
    checkOutLat: 24.6932,
    checkOutLng: 46.8288,
    projectName: 'مشروع مستودعات السلي اللوجستية'
  }
];

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'طلب عهدة نقدية جديد بانتظار الاعتماد',
    body: 'قام م. أحمد الحربي برفع طلب عهدة بمبلغ 1500 ريال لتأمين تمديدات طارئة لمستودعات السلي.',
    date: '2026-06-23 14:30',
    read: false,
    type: 'advance'
  },
  {
    id: 'notif-2',
    title: 'إسناد عميل محتمل جديد',
    body: 'تم إسناد العميل "مجمع نجد الطبي لطب الأسنان" إليك لمعاينة الموقع وتجهيز العرض الفني.',
    date: '2026-06-21 10:15',
    read: true,
    type: 'lead'
  },
  {
    id: 'notif-3',
    title: 'مهمة جديدة مسندة إليك',
    body: 'قامت الإدارة بإسناد مهمة "فحص واختبار ضغط شبكة مياه الإطفاء الرطبة" إليك بإنهاء مطلوب قبل 25 يونيو.',
    date: '2026-06-20 09:00',
    read: true,
    type: 'task'
  }
];

export const DEFAULT_SETTINGS: UserSettings = {
  themeColor: 'blue',
  appMode: 'light',
  companyBranding: true
};

// LocalStorage helpers with type safety
export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(`coreops_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(`coreops_${key}`, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving key ${key} to localStorage:`, error);
  }
};

export const initializeStorage = () => {
  if (!localStorage.getItem('coreops_initialized')) {
    localStorage.setItem('coreops_initialized', 'true');
    saveToStorage('employees', INITIAL_EMPLOYEES);
    saveToStorage('projects', INITIAL_PROJECTS);
    saveToStorage('tasks', INITIAL_TASKS);
    saveToStorage('advances', INITIAL_ADVANCES);
    saveToStorage('assets', INITIAL_ASSETS);
    saveToStorage('leads', INITIAL_LEADS);
    saveToStorage('reports', INITIAL_DAILY_REPORTS);
    saveToStorage('attendance', INITIAL_ATTENDANCE);
    saveToStorage('notifications', INITIAL_NOTIFICATIONS);
    saveToStorage('settings', DEFAULT_SETTINGS);
  }
};
