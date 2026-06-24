import { Conversation, Message, ChatAuditLog, ChatAttachment } from '../types/chat';
import { Employee, Project, Task, Lead, DailyReport, CashAdvance } from '../types';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-dept-all',
    name: 'الجروب العام - شركة CoreOps',
    type: 'group',
    groupType: 'department',
    avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'],
    adminIds: ['emp-1', 'emp-1000'],
    createdAt: '2026-06-01T08:00:00Z',
    pinnedBy: ['emp-1', 'emp-1000']
  },
  {
    id: 'conv-proj-1',
    name: 'مجموعة مشروع مستودعات السلي اللوجستية',
    type: 'group',
    groupType: 'project',
    linkedEntityId: 'proj-1',
    linkedEntityName: 'مشروع مستودعات السلي اللوجستية',
    avatar: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002'],
    adminIds: ['emp-1', 'emp-1001'],
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'conv-proj-2',
    name: 'مجموعة برج الفيصلية - صيانة المولدات',
    type: 'group',
    groupType: 'project',
    linkedEntityId: 'proj-2',
    linkedEntityName: 'برج الفيصلية - صيانة المولدات الاحتياطية',
    avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1001', 'emp-1002'],
    adminIds: ['emp-1'],
    createdAt: '2026-06-12T11:00:00Z'
  },
  {
    id: 'conv-task-1',
    name: 'نقاش مهمة: فحص واختبار ضغط شبكة المياه',
    type: 'group',
    groupType: 'task',
    linkedEntityId: 'task-1',
    linkedEntityName: 'فحص واختبار ضغط شبكة مياه الإطفاء الرطبة',
    avatar: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1000', 'emp-1001'],
    adminIds: ['emp-1000'],
    createdAt: '2026-06-20T09:15:00Z'
  },
  {
    id: 'conv-dept-sales',
    name: 'قسم المبيعات وتطوير الأعمال',
    type: 'group',
    groupType: 'department',
    avatar: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1000', 'emp-1003'],
    adminIds: ['emp-1000', 'emp-1003'],
    createdAt: '2026-06-05T09:00:00Z'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  // Jroup-all messages
  {
    id: 'msg-1',
    senderId: 'emp-1',
    senderName: 'م / أيمن',
    senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    text: 'السلام عليكم جميعاً، نرحب بكم في نظام التواصل والتعاون الموحد لشركة CoreOps. نرجو من الجميع استخدام هذا القسم لمتابعة المشاريع والمهام وإرفاق التقارير اليومية.',
    timestamp: '2026-06-20T08:30:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003']
  },
  {
    id: 'msg-2',
    senderId: 'emp-1001',
    senderName: 'م. أحمد الحربي',
    senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    text: 'وعليكم السلام يا بشمهندس أيمن. ممتاز جداً، هذه الخطوة ستسهل علينا التنسيق الميداني بشكل كبير وسرعة اتخاذ القرارات بخصوص العهد والتشغيل.',
    timestamp: '2026-06-20T08:45:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'],
    replyTo: {
      id: 'msg-1',
      text: 'السلام عليكم جميعاً، نرحب بكم في نظام التواصل والتعاون الموحد لشركة CoreOps...',
      senderName: 'م / أيمن'
    }
  },
  {
    id: 'msg-3',
    senderId: 'emp-1002',
    senderName: 'أ. خالد الدوسري',
    senderAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=150&auto=format&fit=crop',
    text: 'بالتوفيق للجميع! أرجو من المهندسين إرفاق الفواتير بوضوح هنا أو في قسم العهد لتسريع عمليات الصرف وتصفية العهد النقدية.',
    timestamp: '2026-06-20T09:00:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003']
  },

  // Project-1 messages (Al Suly)
  {
    id: 'msg-p1-1',
    senderId: 'emp-1000',
    senderName: 'أ. سارة القحطاني',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop',
    text: 'م. أحمد، هل تم بدء العمل على فحص شبكة مستودع السلي رقم 3؟ العميل يتواصل معي للتأكد من الجدول الزمني لإنهاء الفحص وتوقيع شهادة السلامة.',
    timestamp: '2026-06-23T09:00:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002']
  },
  {
    id: 'msg-p1-2',
    senderId: 'emp-1001',
    senderName: 'م. أحمد الحربي',
    senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    text: 'أهلاً أ. سارة. نعم، باشرنا العمل اليوم، وقمنا بضغط الأنابيب لـ 15 بار. أرفق لكم صورة من مخطط التوزيع وعدادات الفحص للتأكيد الفني.',
    timestamp: '2026-06-23T11:15:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002'],
    attachments: [
      {
        id: 'att-1',
        name: 'مخطط مستودع السلي - شبكة الإطفاء.pdf',
        type: 'pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        size: '1.2 MB'
      },
      {
        id: 'att-2',
        name: 'صورة عداد الضغط الميداني.png',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1581094288338-2314dddb7eed?q=80&w=400&auto=format&fit=crop',
        size: '450 KB'
      }
    ]
  },
  {
    id: 'msg-p1-3',
    senderId: 'emp-1000',
    senderName: 'أ. سارة القحطاني',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop',
    text: 'ممتاز جداً م. أحمد! عمل احترافي وسريع ومخطط واضح جداً. سأرسله للعميل الآن لإبقائه في الصورة وتجهيز موعد تسليم الدفعة القادمة.',
    timestamp: '2026-06-23T11:30:00Z',
    readBy: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002'],
    deliveredTo: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002']
  },

  // Task-1 messages
  {
    id: 'msg-t1-1',
    senderId: 'emp-1001',
    senderName: 'م. أحمد الحربي',
    senderAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
    text: 'تحديث بخصوص فحص الضغط: تم تعبئة الأنابيب بالكامل واختبارها، والضغط مستقر تماماً بعد مرور ساعتين. جاهزون للمرحلة التالية.',
    timestamp: '2026-06-23T14:00:00Z',
    readBy: ['emp-1000', 'emp-1001'],
    deliveredTo: ['emp-1000', 'emp-1001']
  }
];

export const INITIAL_CHAT_AUDITS: ChatAuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-06-20T08:00:00Z',
    employeeId: 'emp-1',
    employeeName: 'م / أيمن',
    action: 'create_group',
    details: 'تم إنشاء الجروب العام لشركة CoreOps وإضافة كافة الموظفين تلقائياً.'
  },
  {
    id: 'aud-2',
    timestamp: '2026-06-23T11:15:00Z',
    employeeId: 'emp-1001',
    employeeName: 'م. أحمد الحربي',
    action: 'upload_file',
    details: 'تم رفع ملف مخطط مستودع السلي وصورة الضغط الميداني في محادثة مشروع السلي.'
  }
];

// Context answers for live simulation chat bots
export const BOT_RESPONSES: Record<string, { replyDelay: number; replies: string[] }> = {
  'emp-1001': { // Eng. Ahmed (Field Engineer)
    replyDelay: 2000,
    replies: [
      'أهلاً بك. أنا متواجد حالياً في الموقع وأقوم بإنهاء الفحص التكتيكي.',
      'تمام يا بشمهندس، تم استلام التوجيه وجاري التنفيذ فوراً.',
      'سأقوم برفع تقرير يومي مفصل عن تقدم الأعمال في غضون ساعة، مع إرفاق صور ما قبل وما بعد.',
      'أحتاج لاعتماد العهدة النقدية المعلقة من فضلك لشراء صمامات أمان إضافية لشبكة الإطفاء.',
      'بخصوص هذا المشروع، المواد متوفرة وبدأ الفنيون في التمديدات اليوم.'
    ]
  },
  'emp-1000': { // Sara (Admin)
    replyDelay: 2500,
    replies: [
      'شكراً لك على التحديث الميداني. تم مراجعة المهام وتوثيقها في النظام.',
      'يرجى التأكد من الالتزام بمعايير السلامة المهنية وارتداء الخوذ والسترات بالموقع.',
      'متاز جداً! العميل سعيد جداً بسرعة الإنجاز وسيقوم بتحويل الدفعة فور صدور الشهادة.',
      'تمت الموافقة على طلب العهدة، يرجى تصفيتها بالفواتير في أسرع وقت لتسوية الحسابات.',
      'هل واجهتم أي مشاكل أو معوقات اليوم أثناء التفتيش الميداني؟'
    ]
  },
  'emp-1002': { // Khaled (Accountant)
    replyDelay: 3000,
    replies: [
      'وعليكم السلام. تم رصد طلب العهدة النقدية وسأقوم بالتحويل المالي فور اعتماد الإدارة.',
      'الرجاء من الجميع عدم نسيان إرفاق الفواتير الضريبية المبسطة باسم الشركة لتصفية العهد.',
      'تم تحويل المبلغ لحسابكم البنكي الآن، يرجى تأكيد الاستلام وتزويدي بإيصالات الشراء.',
      'لقد قمت بتحديث حالة تصفية العهدة السابقة لـ "مكتمل ومصفى" بناءً على الفواتير المرفوعة.',
      'بخصوص ميزانية المشروع الجديد، تم فتح الحساب وتخصيص المبالغ التشغيلية اللازمة.'
    ]
  },
  'emp-1003': { // Fahad (Sales)
    replyDelay: 2200,
    replies: [
      'أهلاً بالفريق! تم قيد عميل محتمل جديد وربطه بقسم المعاينة، يحتاج لزيارة ميدانية عاجلة لتقدير التكلفة.',
      'تم إرسال عرض السعر المالي لشركة مصنع الجزيرة، وننتظر الرد بالاعتماد هذا الأسبوع إن شاء الله.',
      'لدينا فرصة تسويقية واعدة لتركيب أنظمة إنذار مبكر في مجمع طبي بشمال الرياض.',
      'تم الانتهاء من الاتفاق المبدئي ومستعدون لصياغة العقد النهائي للمشروع الجديد.',
      'سأقوم بتحديث بيانات العميل في قسم المبيعات وإرفاق المخططات الأولية.'
    ]
  }
};

// Auto-generate project chat if new project is created
export const getOrAddProjectGroup = (
  project: Project,
  conversations: Conversation[],
  currentUserId: string
): { updatedConversations: Conversation[]; newGroup?: Conversation } => {
  const exists = conversations.find(c => c.linkedEntityId === project.id && c.groupType === 'project');
  if (exists) {
    return { updatedConversations: conversations };
  }

  const newGroup: Conversation = {
    id: `conv-proj-${project.id}`,
    name: `مجموعة مشروع: ${project.name}`,
    type: 'group',
    groupType: 'project',
    linkedEntityId: project.id,
    linkedEntityName: project.name,
    avatar: project.type === 'firefighting' 
      ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=150&auto=format&fit=crop'
      : project.type === 'alarm'
      ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=150&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1000', 'emp-1001', 'emp-1002', 'emp-1003'], // Auto assign all core team members
    adminIds: [currentUserId, 'emp-1'],
    createdAt: new Date().toISOString()
  };

  return {
    updatedConversations: [newGroup, ...conversations],
    newGroup
  };
};

// Auto-generate task chat if requested
export const getOrAddTaskGroup = (
  task: Task,
  conversations: Conversation[],
  currentUserId: string
): { updatedConversations: Conversation[]; newGroup?: Conversation } => {
  const exists = conversations.find(c => c.linkedEntityId === task.id && c.groupType === 'task');
  if (exists) {
    return { updatedConversations: conversations };
  }

  const newGroup: Conversation = {
    id: `conv-task-${task.id}`,
    name: `نقاش مهمة: ${task.title}`,
    type: 'group',
    groupType: 'task',
    linkedEntityId: task.id,
    linkedEntityName: task.title,
    avatar: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=150&auto=format&fit=crop',
    memberIds: ['emp-1', 'emp-1000', 'emp-1001'], // Admin, Sub-admin, Assigned Engineer
    adminIds: [currentUserId, 'emp-1000'],
    createdAt: new Date().toISOString()
  };

  return {
    updatedConversations: [newGroup, ...conversations],
    newGroup
  };
};
