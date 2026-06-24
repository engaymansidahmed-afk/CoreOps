import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, ChatAttachment, ChatAuditLog, ChatAttachmentType } from '../types/chat';
import { Employee, Project, Task, Lead, DailyReport, CashAdvance } from '../types';
import { useAppTheme } from './ThemeContext';
import { 
  MessageSquare, Send, Paperclip, Image, FileText, Video, Mic, MoreVertical, 
  Plus, Search, Trash, Edit, CheckCheck, Check, Users, Phone, Info, X, 
  CornerUpRight, Pin, Volume2, Archive, Download, Upload, Shield, 
  Activity, FileSpreadsheet, Play, Pause, AlertCircle, Sparkles, FolderSync, Share2, HelpCircle
} from 'lucide-react';
import { BOT_RESPONSES, INITIAL_CONVERSATIONS, INITIAL_MESSAGES, INITIAL_CHAT_AUDITS, getOrAddProjectGroup, getOrAddTaskGroup } from '../data/chatData';
import { loadFromStorage, saveToStorage } from '../data';

interface ChatCenterProps {
  currentUser: Employee;
  employees: Employee[];
  projects: Project[];
  tasks: Task[];
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  // Optional parameters to automatically open a specific linked chat
  autoOpenLinkedEntity?: { type: 'project' | 'task'; id: string };
  onClose?: () => void;
}

export function ChatCenter({ 
  currentUser, 
  employees, 
  projects, 
  tasks, 
  onShowToast, 
  autoOpenLinkedEntity,
  onClose 
}: ChatCenterProps) {
  const { themeColor, primaryBg, primaryText, primaryLightBg, badgeBg, badgeText } = useAppTheme();

  // State Management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<ChatAuditLog[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chats' | 'audits' | 'stats'>('chats');
  const [convFilter, setConvFilter] = useState<'all' | 'private' | 'group' | 'project' | 'task' | 'department'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');

  // UI state
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null);
  const [searchMessageQuery, setSearchMessageQuery] = useState('');

  // Group Create Form State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<Conversation['groupType']>('custom');
  const [newGroupMembers, setNewGroupMembers] = useState<string[]>([currentUser.id]);
  const [linkedEntityId, setLinkedEntityId] = useState('');

  // Audio Recording Emulation State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Typing status list (conversationId -> senderName)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Message scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize and load chat data
  useEffect(() => {
    const loadedConvs = loadFromStorage<Conversation[]>('chat_conversations', INITIAL_CONVERSATIONS);
    const loadedMsgs = loadFromStorage<Message[]>('chat_messages', INITIAL_MESSAGES);
    const loadedAudits = loadFromStorage<ChatAuditLog[]>('chat_audits', INITIAL_CHAT_AUDITS);

    // Sync automatic group creation for all existing projects
    let updatedConvs = [...loadedConvs];
    projects.forEach(proj => {
      const { updatedConversations } = getOrAddProjectGroup(proj, updatedConvs, currentUser.id);
      updatedConvs = updatedConversations;
    });

    // Sync automatic group creation for all existing tasks
    tasks.forEach(task => {
      const { updatedConversations } = getOrAddTaskGroup(task, updatedConvs, currentUser.id);
      updatedConvs = updatedConversations;
    });

    setConversations(updatedConvs);
    setMessages(loadedMsgs);
    setAuditLogs(loadedAudits);

    saveToStorage('chat_conversations', updatedConvs);

    // Handle autoOpenLinkedEntity if passed
    if (autoOpenLinkedEntity) {
      const match = updatedConvs.find(c => c.linkedEntityId === autoOpenLinkedEntity.id && c.groupType === autoOpenLinkedEntity.type);
      if (match) {
        setSelectedConvId(match.id);
      } else {
        // Find corresponding entity to make a new chat
        if (autoOpenLinkedEntity.type === 'project') {
          const projObj = projects.find(p => p.id === autoOpenLinkedEntity.id);
          if (projObj) {
            const { updatedConversations, newGroup } = getOrAddProjectGroup(projObj, updatedConvs, currentUser.id);
            setConversations(updatedConversations);
            saveToStorage('chat_conversations', updatedConversations);
            if (newGroup) setSelectedConvId(newGroup.id);
          }
        } else if (autoOpenLinkedEntity.type === 'task') {
          const taskObj = tasks.find(t => t.id === autoOpenLinkedEntity.id);
          if (taskObj) {
            const { updatedConversations, newGroup } = getOrAddTaskGroup(taskObj, updatedConvs, currentUser.id);
            setConversations(updatedConversations);
            saveToStorage('chat_conversations', updatedConversations);
            if (newGroup) setSelectedConvId(newGroup.id);
          }
        }
      }
    } else if (updatedConvs.length > 0) {
      // Select first chat by default
      setSelectedConvId(updatedConvs[0].id);
    }
  }, [projects, tasks, autoOpenLinkedEntity]);

  // Save changes to localStorage on states changes
  useEffect(() => {
    if (conversations.length > 0) saveToStorage('chat_conversations', conversations);
  }, [conversations]);

  useEffect(() => {
    if (messages.length > 0) saveToStorage('chat_messages', messages);
  }, [messages]);

  useEffect(() => {
    if (auditLogs.length > 0) saveToStorage('chat_audits', auditLogs);
  }, [auditLogs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedConvId, typingUsers]);

  // Audio recording timer simulation
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  // Helper: Format recording time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Log action in audits
  const addAuditLog = (action: ChatAuditLog['action'], details: string) => {
    const newLog: ChatAuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      action,
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Get active conversation
  const activeConv = conversations.find(c => c.id === selectedConvId);

  // Resolve direct chat user name
  const getConversationDetails = (conv: Conversation) => {
    if (conv.type === 'private') {
      const otherUserId = conv.memberIds.find(id => id !== currentUser.id) || '';
      const otherUser = employees.find(e => e.id === otherUserId);
      return {
        name: otherUser ? otherUser.name : 'موظف غير معروف',
        avatar: otherUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
        role: otherUser ? otherUser.role : '',
        code: otherUser ? otherUser.code : '',
        phone: otherUser ? otherUser.phone : '',
        email: otherUser ? otherUser.email : '',
        online: otherUserId !== 'emp-1002' // Simulating everyone online except Accountant (sometimes offline)
      };
    }
    return {
      name: conv.name,
      avatar: conv.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=150&auto=format&fit=crop',
      role: conv.groupType === 'project' ? 'مجموعة مشروع' : conv.groupType === 'task' ? 'نقاش مهمة' : 'مجموعة قسم',
      code: '',
      phone: '',
      email: '',
      online: true
    };
  };

  // Filter conversations
  const filteredConvs = conversations.filter(conv => {
    const details = getConversationDetails(conv);
    const matchesSearch = details.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (convFilter === 'all') return true;
    if (convFilter === 'private') return conv.type === 'private';
    if (convFilter === 'group') return conv.type === 'group';
    return conv.groupType === convFilter;
  });

  // Filter messages for active conversation
  const filteredMessages = messages.filter(msg => {
    const belongsToConv = (activeConv?.type === 'group' && msg.replyTo === undefined && activeConv.id === 'conv-dept-all' && !msg.id.includes('-p1') && !msg.id.includes('-t1') && !msg.id.includes('-direct')) ||
      (activeConv?.id === 'conv-proj-1' && msg.id.includes('-p1')) ||
      (activeConv?.id === 'conv-proj-2' && msg.id.includes('-proj2')) ||
      (activeConv?.id === 'conv-task-1' && msg.id.includes('-t1')) ||
      // Private or specific custom convs: matches sender/receiver linkage
      (activeConv?.type === 'private' && (
        (msg.senderId === currentUser.id && msg.id.includes(`-direct-${activeConv.id}`)) ||
        (msg.senderId === activeConv.memberIds.find(id => id !== currentUser.id) && msg.id.includes(`-direct-${activeConv.id}`))
      )) ||
      // General match for any new dynamically created groups/chats
      (msg.id.startsWith(`msg-dyn-${selectedConvId}-`));

    // Wait, let's keep it simple: we can store `conversationId` inside `Message`!
    // But since INITIAL_MESSAGES don't have conversationId, let's inject it or adapt to it!
    // Let's add standard `conversationId` check to support any message sent dynamically.
    // Yes, we will check either explicit `conversationId` property OR the legacy ID-based mapping.
    const hasConvIdMatch = (msg as any).conversationId === selectedConvId;
    
    const matchesPinned = showPinnedOnly ? msg.pinned : true;
    const matchesSearch = searchMessageQuery ? msg.text.toLowerCase().includes(searchMessageQuery.toLowerCase()) : true;

    return (belongsToConv || hasConvIdMatch) && matchesPinned && !msg.deleted && matchesSearch;
  });

  // Send message handler
  const handleSendMessage = (customText?: string, attachments?: ChatAttachment[]) => {
    if (!selectedConvId) return;
    const textToSend = customText !== undefined ? customText : messageText;
    if (!textToSend.trim() && (!attachments || attachments.length === 0)) return;

    const newMessageId = `msg-dyn-${selectedConvId}-${Date.now()}`;
    const newMsg: Message = {
      id: newMessageId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
      text: textToSend,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      deliveredTo: [currentUser.id],
      attachments,
      replyTo: replyingToMessage ? {
        id: replyingToMessage.id,
        text: replyingToMessage.text,
        senderName: replyingToMessage.senderName
      } : undefined
    };

    // Inject conversationId property for dynamic matching
    (newMsg as any).conversationId = selectedConvId;

    // Trigger mentioning audit logs
    if (textToSend.includes('@')) {
      const mentions = employees.filter(e => textToSend.includes(`@${e.name}`));
      if (mentions.length > 0) {
        newMsg.mentions = mentions.map(e => e.id);
        addAuditLog('pin_message', `قام ${currentUser.name} بالإشارة إلى ${mentions.map(e => e.name).join('، ')} في المحادثة.`);
      }
    }

    setMessages(prev => [...prev, newMsg]);
    setMessageText('');
    setReplyingToMessage(null);

    // Update conversation lastMessage & unread count for other members
    setConversations(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return {
          ...c,
          lastMessage: newMsg
        };
      }
      return c;
    }));

    // Trigger AI Simulator auto-response if the chat is not with yourself
    triggerSimulatedAutoResponse(textToSend, selectedConvId);
  };

  // Context-aware Auto-response Simulator
  const triggerSimulatedAutoResponse = (userText: string, convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (!conv) return;

    // Determine who will reply
    let replier: Employee | undefined;
    if (conv.type === 'private') {
      const otherId = conv.memberIds.find(id => id !== currentUser.id);
      replier = employees.find(e => e.id === otherId);
    } else {
      // Group chat: choose a member of the group other than current user
      const otherMembers = conv.memberIds.filter(id => id !== currentUser.id);
      if (otherMembers.length > 0) {
        // Randomly choose an appropriate replier from BOT_RESPONSES
        const choice = otherMembers.find(id => BOT_RESPONSES[id] !== undefined);
        if (choice) replier = employees.find(e => e.id === choice);
      }
    }

    if (!replier || !BOT_RESPONSES[replier.id]) return;

    const botConfig = BOT_RESPONSES[replier.id];

    // Show typing status after 1s
    setTimeout(() => {
      setTypingUsers(prev => ({
        ...prev,
        [convId]: [...(prev[convId] || []), replier!.name]
      }));
    }, 800);

    // Select suitable reply based on keywords in user message
    let chosenReply = botConfig.replies[Math.floor(Math.random() * botConfig.replies.length)];
    const lowerText = userText.toLowerCase();

    if (lowerText.includes('مستودع') || lowerText.includes('السلي') || lowerText.includes('مشروع')) {
      if (replier.role === 'engineer') {
        chosenReply = 'مستودعات السلي بوضع ممتاز ومستقر. الضغط الآن مستقر على 15 بار ونحن بصدد إغلاق المهمة غداً.';
      } else if (replier.role === 'admin') {
        chosenReply = 'الرجاء توثيق كافة اختبارات الضغط لمشروع السلي بتقرير الإنجاز اليومي ورفع الصور المعتمدة فورا.';
      }
    } else if (lowerText.includes('عهدة') || lowerText.includes('فلوس') || lowerText.includes('مبلغ') || lowerText.includes('ريال')) {
      if (replier.role === 'accountant') {
        chosenReply = 'تم تسجيل طلب العهدة. ستقوم الإدارة باعتماده حالاً ويتم تحويل المبلغ لحسابكم مباشرة.';
      } else if (replier.role === 'engineer') {
        chosenReply = 'أنا بانتظار العهدة النقدية لتسوية فواتير مواد التمديد الإضافية من الموردين.';
      }
    } else if (lowerText.includes('تقرير') || lowerText.includes('أنجزت') || lowerText.includes('اليومي')) {
      if (replier.role === 'engineer') {
        chosenReply = 'تقرير اليومي جاهز وتم رفعه في النظام مع صور ما قبل وما بعد العمل الميداني.';
      } else if (replier.role === 'admin') {
        chosenReply = 'شكراً لك. قمت بمراجعة التقارير الميدانية وتبدو مطابقة لخطط السلامة الهندسية.';
      }
    } else if (lowerText.includes('سلام عليكم') || lowerText.includes('مرحبا') || lowerText.includes('هلا')) {
      chosenReply = `وعليكم السلام ورحمة الله وبركاته، أهلاً بك يا ${currentUser.name}. كيف يمكنني مساعدتك اليوم بخصوص أعمال التشغيل والمقاولات؟`;
    }

    // Deliver message after replyDelay
    setTimeout(() => {
      // Remove typing user
      setTypingUsers(prev => ({
        ...prev,
        [convId]: (prev[convId] || []).filter(name => name !== replier!.name)
      }));

      const botMsgId = `msg-bot-${convId}-${Date.now()}`;
      const botMsg: Message = {
        id: botMsgId,
        senderId: replier!.id,
        senderName: replier!.name,
        senderAvatar: replier!.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
        text: chosenReply,
        timestamp: new Date().toISOString(),
        readBy: [currentUser.id, replier!.id],
        deliveredTo: [currentUser.id, replier!.id],
      };
      (botMsg as any).conversationId = convId;

      setMessages(prev => [...prev, botMsg]);

      // Update conversation
      setConversations(prev => prev.map(c => {
        if (c.id === convId) {
          return {
            ...c,
            lastMessage: botMsg
          };
        }
        return c;
      }));

      // Toast notification if not currently viewing this conversation
      if (selectedConvId !== convId) {
        onShowToast(`💬 رسالة جديدة من ${replier!.name}: ${chosenReply.substring(0, 40)}...`, 'info');
      }
    }, botConfig.replyDelay);
  };

  // Create Custom/Department Chat Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || newGroupMembers.length < 2) {
      onShowToast('الرجاء تعبئة اسم المجموعة واختيار عضوين على الأقل', 'error');
      return;
    }

    const newGroup: Conversation = {
      id: `conv-custom-${Date.now()}`,
      name: newGroupName,
      type: 'group',
      groupType: newGroupType,
      memberIds: newGroupMembers,
      adminIds: [currentUser.id],
      createdAt: new Date().toISOString(),
      avatar: newGroupType === 'department' 
        ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=150&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=150&auto=format&fit=crop'
    };

    if (linkedEntityId) {
      newGroup.linkedEntityId = linkedEntityId;
      const proj = projects.find(p => p.id === linkedEntityId);
      if (proj) newGroup.linkedEntityName = proj.name;
    }

    setConversations(prev => [newGroup, ...prev]);
    setSelectedConvId(newGroup.id);
    setShowCreateGroup(false);
    onShowToast(`🎉 تم إنشاء المجموعة "${newGroupName}" بنجاح!`, 'success');
    addAuditLog('create_group', `تم إنشاء مجموعة جديدة باسم "${newGroupName}" من نوع ${newGroupType}.`);

    // Clear form
    setNewGroupName('');
    setNewGroupMembers([currentUser.id]);
    setLinkedEntityId('');
  };

  // Toggle member in new group form
  const toggleGroupMemberSelection = (empId: string) => {
    setNewGroupMembers(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  // Simulate file upload and attach to chat
  const handleFileUpload = (files: FileList | null, type: ChatAttachmentType) => {
    if (!files || files.length === 0) return;

    const newAttachments: ChatAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mockUrl = type === 'image' 
        ? 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=400&auto=format&fit=crop'
        : type === 'video'
        ? 'https://assets.mixkit.co/videos/preview/mixkit-foreman-looking-at-a-tablet-at-construction-site-34283-large.mp4'
        : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

      newAttachments.push({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        type,
        url: mockUrl,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      });
    }

    handleSendMessage(`أرفق لكم المستند التشغيلي: ${newAttachments.map(a => a.name).join(', ')}`, newAttachments);
    onShowToast(`📎 تم تحميل وإرسال ${newAttachments.length} ملفات بنجاح`, 'success');
    addAuditLog('upload_file', `رفع ${currentUser.name} ملفات جديدة في المحادثة.`);
  };

  // Drag-and-drop triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Auto classify based on extension
      const firstFile = e.dataTransfer.files[0];
      const isImg = firstFile.type.startsWith('image/');
      const isVid = firstFile.type.startsWith('video/');
      const isPdf = firstFile.name.endsWith('.pdf');
      const docType: ChatAttachmentType = isImg ? 'image' : isVid ? 'video' : isPdf ? 'pdf' : 'document';
      handleFileUpload(e.dataTransfer.files, docType);
    }
  };

  // Edit Message
  const handleEditMessage = (msg: Message) => {
    setEditingMessage(msg);
    setEditText(msg.text);
  };

  const saveEditedMessage = () => {
    if (!editingMessage || !editText.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text: editText, edited: true } : m));
    setEditingMessage(null);
    setEditText('');
    onShowToast('تم تعديل الرسالة بنجاح', 'success');
  };

  // Delete Message (Soft delete)
  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
    onShowToast('تم حذف الرسالة بنجاح', 'info');
    addAuditLog('delete_message', `تم حذف رسالة بواسطة ${currentUser.name}.`);
  };

  // Pin Message
  const togglePinMessage = (msg: Message) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, pinned: !m.pinned } : m));
    onShowToast(msg.pinned ? 'تم إلغاء تثبيت الرسالة' : '📌 تم تثبيت الرسالة في أعلى المحادثة', 'success');
    addAuditLog('pin_message', msg.pinned ? `إلغاء تثبيت رسالة` : `تم تثبيت رسالة هامة في المجموعة.`);
  };

  // Forward Message
  const handleForwardMessage = (msg: Message) => {
    setForwardingMessage(msg);
  };

  const executeForward = (targetConvId: string) => {
    if (!forwardingMessage) return;

    const forwardId = `msg-fwd-${Date.now()}`;
    const targetConv = conversations.find(c => c.id === targetConvId);
    if (!targetConv) return;

    const forwardedMsg: Message = {
      id: forwardId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=150&auto=format&fit=crop',
      text: `🔄 رسالة محولة: ${forwardingMessage.text}`,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      deliveredTo: [currentUser.id],
      attachments: forwardingMessage.attachments
    };
    (forwardedMsg as any).conversationId = targetConvId;

    setMessages(prev => [...prev, forwardedMsg]);
    setForwardingMessage(null);
    onShowToast(`تم تحويل الرسالة بنجاح إلى "${getConversationDetails(targetConv).name}"`, 'success');
  };

  // Voice recording simulation
  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      // Save recorded
      setIsRecording(false);
      const voiceAttachment: ChatAttachment = {
        id: `att-voice-${Date.now()}`,
        name: `رسالة صوتية مبرمجة_${formatTime(recordingSeconds)}.mp3`,
        type: 'voice',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // dummy audio url
        size: '150 KB',
        duration: recordingSeconds
      };
      handleSendMessage('🎤 رسالة صوتية مرسلة', [voiceAttachment]);
      onShowToast('🎙️ تم إرسال الرسالة الصوتية الميدانية بنجاح', 'success');
    } else {
      // Start recording
      setIsRecording(true);
      onShowToast('🎙️ جاري تسجيل الصوت الآن... تحدث بوضوح', 'info');
    }
  };

  // Backup System: Export Chat Database
  const handleBackupExport = () => {
    const backupData = {
      conversations,
      messages,
      auditLogs
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CoreOps_Chat_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('💾 تم حفظ وتصدير النسخة الاحتياطية للاتصالات بنجاح!', 'success');
  };

  // Archive / Unarchive chat
  const toggleArchiveConversation = (convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const archived = c.archivedBy || [];
        const updated = archived.includes(currentUser.id) 
          ? archived.filter(id => id !== currentUser.id)
          : [...archived, currentUser.id];
        return { ...c, archivedBy: updated };
      }
      return c;
    }));
    onShowToast('تم تحديث حالة أرشفة المحادثة', 'info');
    addAuditLog('archive_chat', `تعديل حالة أرشفة المحادثة: ${convId}`);
  };

  // Pin / Unpin Conversation in Sidebar
  const togglePinConversation = (convId: string) => {
    setConversations(prev => prev.map(c => {
      if (c.id === convId) {
        const pinned = c.pinnedBy || [];
        const updated = pinned.includes(currentUser.id)
          ? pinned.filter(id => id !== currentUser.id)
          : [...pinned, currentUser.id];
        return { ...c, pinnedBy: updated };
      }
      return c;
    }));
    onShowToast('تم تحديث تثبيت المحادثة في القائمة', 'success');
  };

  // Direct DM from profile card helper
  const handleStartDirectChat = (employee: Employee) => {
    if (employee.id === currentUser.id) {
      onShowToast('لا يمكنك بدء محادثة خاصة مع نفسك', 'warning');
      return;
    }

    const existing = conversations.find(
      c => c.type === 'private' && c.memberIds.includes(employee.id) && c.memberIds.includes(currentUser.id)
    );

    if (existing) {
      setSelectedConvId(existing.id);
      setActiveTab('chats');
    } else {
      const newPrivateConv: Conversation = {
        id: `conv-private-${Date.now()}`,
        name: employee.name,
        type: 'private',
        memberIds: [currentUser.id, employee.id],
        adminIds: [currentUser.id, employee.id],
        createdAt: new Date().toISOString()
      };
      setConversations(prev => [newPrivateConv, ...prev]);
      setSelectedConvId(newPrivateConv.id);
      setActiveTab('chats');
      onShowToast(`💬 تم فتح نافذة المحادثة المباشرة مع ${employee.name}`, 'success');
    }
  };

  // Statistics Calculation
  const totalMessagesSent = messages.length;
  const totalAttachmentsSent = messages.reduce((acc, curr) => acc + (curr.attachments?.length || 0), 0);
  const activeGroupsCount = conversations.filter(c => c.type === 'group').length;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 p-4 min-h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4" style={{ direction: 'rtl' }}>
      
      {/* 🚀 TAB SWITCHER HUD */}
      <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 ${primaryLightBg} ${primaryText} rounded-lg`}>
              <Users className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">بوابة الاتصالات الموحدة</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xs flex gap-1">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'chats' ? `${primaryBg} text-white shadow-xs` : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            💬 الدردشات
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'audits' ? `${primaryBg} text-white shadow-xs` : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            🛡️ سجل الرقابة
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeTab === 'stats' ? `${primaryBg} text-white shadow-xs` : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            📊 تقارير التعاون
          </button>
        </div>

        {/* 📋 CHATS TAB SIDEBAR */}
        {activeTab === 'chats' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-3 shadow-xs h-[500px] md:h-[600px] overflow-hidden">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="بحث عن موظف أو مجموعة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Conversation Group Filters */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setConvFilter('all')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${convFilter === 'all' ? `${primaryBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setConvFilter('private')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${convFilter === 'private' ? `${primaryBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                خاص
              </button>
              <button
                onClick={() => setConvFilter('project')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${convFilter === 'project' ? `${primaryBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                مشاريع
              </button>
              <button
                onClick={() => setConvFilter('task')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${convFilter === 'task' ? `${primaryBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                مهام
              </button>
              <button
                onClick={() => setConvFilter('department')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 ${convFilter === 'department' ? `${primaryBg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
              >
                أقسام
              </button>
            </div>

            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إنشاء مجموعة تعاون جديدة</span>
            </button>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredConvs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-sans">
                  لا توجد محادثات تطابق الفلتر الحالي
                </div>
              ) : (
                filteredConvs.map(conv => {
                  const details = getConversationDetails(conv);
                  const isSelected = conv.id === selectedConvId;
                  const isPinned = conv.pinnedBy?.includes(currentUser.id);
                  const isArchived = conv.archivedBy?.includes(currentUser.id);

                  // Skip archived if not showing archives explicitly
                  if (isArchived) return null;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`p-2.5 flex items-center justify-between gap-2.5 cursor-pointer rounded-xl transition-all ${isSelected ? `${primaryLightBg} border-r-4 border-blue-500` : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <img
                            src={details.avatar}
                            alt={details.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          {details.online && (
                            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                          )}
                        </div>
                        <div className="min-w-0 text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {details.name}
                            </span>
                            {isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                            {conv.lastMessage ? conv.lastMessage.text : 'لا توجد رسائل سابقة'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {conv.groupType && (
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-md ${badgeBg} ${badgeText}`}>
                            {conv.groupType === 'project' ? 'مشروع' : conv.groupType === 'task' ? 'مهمة' : 'قسم'}
                          </span>
                        )}
                        <span className="text-[8px] text-slate-400">
                          {conv.lastMessage ? new Date(conv.lastMessage.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Actions (Backup / Restore / Archive) */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between gap-2">
              <button
                onClick={handleBackupExport}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                title="تصدير نسخة احتياطية للدردشات والمستندات"
              >
                <FolderSync className="w-3.5 h-3.5" />
                <span>تصدير نسخة احتياطية</span>
              </button>
            </div>
          </div>
        )}

        {/* 📋 STATS AND PARTICIPANTS */}
        {activeTab === 'stats' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">إحصاءات التعاون التشغيلي</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
                <span className="text-xl font-bold text-blue-500 font-mono">{totalMessagesSent}</span>
                <p className="text-[10px] text-slate-400 mt-1">الرسائل المتبادلة</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-center">
                <span className="text-xl font-bold text-emerald-500 font-mono">{totalAttachmentsSent}</span>
                <p className="text-[10px] text-slate-400 mt-1">الملفات والمستندات</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">النشاط التعاوني حسب الأقسام</span>
              <div className="space-y-2 mt-1">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>قسم المقاولات والسلامة</span>
                    <span className="font-mono font-bold">75%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>المبيعات وتطوير الأعمال</span>
                    <span className="font-mono font-bold">45%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>المالية والعهد التشغيلية</span>
                    <span className="font-mono font-bold">60%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>تكامل الاتصالات الميدانية</span>
              </span>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-1 leading-relaxed">
                يتم قيد المحادثات وأرشفتها وربطها تلقائياً بالمشاريع والمهام الجارية. تتيح هذه اللوحة استخراج بيانات التواصل لأغراض التحقيق والتدقيق التشغيلي لمهام الدفاع المدني.
              </p>
            </div>
          </div>
        )}

        {/* 📋 AUDITS TAB */}
        {activeTab === 'audits' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs h-[500px] md:h-[600px] overflow-hidden flex flex-col gap-3">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">سجل الرقابة والأمن للاتصالات</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              توثيق العمليات الحساسة في غرف المحادثات كالتحميل والمسح والتعديل والإنشاء للمجموعات.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5">
              {auditLogs.map(log => (
                <div key={log.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{log.employeeName}</span>
                    <span className="text-[8px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString('ar-SA')}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 🚀 CHAT MESSAGING WORKSPACE PANEL */}
      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col shadow-xs overflow-hidden h-[570px] md:h-[680px]">
        {activeConv ? (
          <>
            {/* Header of Active Chat */}
            {(() => {
              const details = getConversationDetails(activeConv);
              return (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer" onClick={() => setShowGroupInfo(true)}>
                      <img
                        src={details.avatar}
                        alt={details.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-900"
                        referrerPolicy="no-referrer"
                      />
                      {details.online && (
                        <span className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs md:text-sm text-slate-800 dark:text-slate-100 block cursor-pointer hover:underline" onClick={() => setShowGroupInfo(true)}>
                        {details.name}
                      </span>
                      {activeConv.type === 'private' ? (
                        <span className="text-[10px] text-slate-400">{details.role} | {details.online ? 'نشط الآن' : 'غير متصل'}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">مجموعة • {activeConv.memberIds.length} موظفاً</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Filter Pinned Messages */}
                    <button
                      onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${showPinnedOnly ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                      title={showPinnedOnly ? 'إظهار كل الرسائل' : 'عرض الرسائل المثبتة الهامة فقط'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>

                    {/* Inline search inside conversation */}
                    <div className="relative hidden md:block">
                      <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="بحث في الرسائل..."
                        value={searchMessageQuery}
                        onChange={(e) => setSearchMessageQuery(e.target.value)}
                        className="pr-8 pl-2 py-1.5 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-36 focus:w-48 transition-all focus:outline-hidden"
                      />
                    </div>

                    <button
                      onClick={() => setShowGroupInfo(!showGroupInfo)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="معلومات المجموعة والتكامل"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleArchiveConversation(activeConv.id)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                      title="أرشفة المحادثة"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Chat Messages Log Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 overflow-y-auto p-4 space-y-3.5 text-right relative ${isDragging ? 'bg-blue-50/50 dark:bg-blue-950/20 border-2 border-dashed border-blue-500' : 'bg-slate-50/30 dark:bg-slate-900/10'}`}
            >
              {isDragging && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 flex flex-col items-center justify-center z-10 pointer-events-none">
                  <Upload className="w-12 h-12 text-blue-500 animate-bounce" />
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200 mt-2">اسحب وأفلت الملفات لرفعها وإرسالها حالاً</span>
                </div>
              )}

              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-400 font-sans">
                    {showPinnedOnly ? 'لا توجد رسائل مثبتة هامة في هذه المحادثة' : 'لا توجد رسائل بعد. ابدأ المحادثة الآن لإرسال مخططات وتنسيق الأعمال.'}
                  </p>
                </div>
              ) : (
                filteredMessages.map(msg => {
                  const isOwn = msg.senderId === currentUser.id;
                  const isPinned = msg.pinned;
                  const mentionsMe = msg.mentions?.includes(currentUser.id);

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${isOwn ? 'items-start' : 'items-end'} max-w-full group`}
                    >
                      {/* Sender Info */}
                      {!isOwn && (
                        <span className="text-[9px] font-bold text-slate-500 mb-0.5 ml-2 mr-2">
                          {msg.senderName}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 max-w-[85%] group">
                        
                        {/* Hover Actions Menu (Visible on hover for custom experiences) */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={() => setReplyingToMessage(msg)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                            title="رد"
                          >
                            <CornerUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => togglePinMessage(msg)}
                            className={`p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer ${isPinned ? 'text-amber-500' : 'text-slate-400'}`}
                            title="تثبيت"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleForwardMessage(msg)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                            title="تحويل"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {isOwn && (
                            <>
                              <button
                                onClick={() => handleEditMessage(msg)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 cursor-pointer"
                                title="تعديل"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-rose-500 cursor-pointer"
                                title="مسح"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Message Bubble Container */}
                        <div 
                          className={`p-3 rounded-2xl relative text-xs leading-relaxed font-sans shadow-xs ${
                            isOwn 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : mentionsMe 
                              ? 'bg-amber-100 text-slate-900 border border-amber-300 rounded-tl-none animate-pulse'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {/* Pinned Marker */}
                          {isPinned && (
                            <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold mb-1 border-b border-slate-200/20 pb-0.5">
                              <Pin className="w-2.5 h-2.5" />
                              <span>رسالة مثبتة هامة</span>
                            </div>
                          )}

                          {/* Replied context rendering */}
                          {msg.replyTo && (
                            <div className="text-[10px] bg-black/10 p-1.5 rounded-lg mb-1 text-right border-r-2 border-white/50 max-w-full overflow-hidden truncate">
                              <span className="font-bold block text-[9px] opacity-80">{msg.replyTo.senderName}</span>
                              <span className="opacity-75">{msg.replyTo.text}</span>
                            </div>
                          )}

                          {/* Message Text */}
                          <p>{msg.text}</p>

                          {/* Media attachments inside bubble */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5 border-t border-white/10 dark:border-slate-700/50 pt-2">
                              {msg.attachments.map(att => (
                                <div key={att.id} className="bg-black/10 dark:bg-slate-900/30 p-2 rounded-xl flex items-center justify-between gap-3 text-right">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {att.type === 'image' && <Image className="w-4 h-4 shrink-0 text-blue-300" />}
                                    {att.type === 'video' && <Video className="w-4 h-4 shrink-0 text-indigo-300" />}
                                    {att.type === 'pdf' && <FileText className="w-4 h-4 shrink-0 text-red-300" />}
                                    {att.type === 'voice' && <Volume2 className="w-4 h-4 shrink-0 text-emerald-300" />}
                                    {(att.type === 'document') && <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-300" />}
                                    <div className="min-w-0">
                                      <span className="text-[10px] font-bold block truncate">{att.name}</span>
                                      <span className="text-[8px] opacity-75 block">{att.size}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {att.type === 'image' && (
                                      <button 
                                        onClick={() => setActiveImagePreview(att.url)}
                                        className="p-1 hover:bg-white/15 dark:hover:bg-slate-800 rounded text-[9px] font-bold cursor-pointer underline text-blue-300"
                                      >
                                        معاينة
                                      </button>
                                    )}
                                    <a 
                                      href={att.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      download 
                                      className="p-1 hover:bg-white/15 dark:hover:bg-slate-800 rounded text-[9px] font-bold cursor-pointer text-white flex items-center gap-0.5"
                                    >
                                      <Download className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Timestamp and receipts */}
                          <div className="flex items-center justify-end gap-1 mt-1 text-[8px] opacity-75">
                            <span>{new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                            {msg.edited && <span>• معدل</span>}
                            {isOwn && (
                              msg.readBy.length > 1 ? (
                                <CheckCheck className="w-3 h-3 text-cyan-300 shrink-0" />
                              ) : (
                                <Check className="w-3 h-3 shrink-0" />
                              )
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}

              {/* Bot typing simulator indicator */}
              {typingUsers[selectedConvId] && typingUsers[selectedConvId].map(name => (
                <div key={name} className="flex flex-col items-end max-w-full">
                  <span className="text-[9px] font-bold text-slate-500 mb-0.5 ml-2 mr-2">
                    {name}
                  </span>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl rounded-tl-none text-[10px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    <span>يكتب الآن...</span>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Quoted Message HUD if replying */}
            {replyingToMessage && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-right">
                <div className="text-xs text-slate-600 dark:text-slate-300 border-r-2 border-blue-500 pr-2 overflow-hidden truncate">
                  <span className="font-bold text-[10px] block text-blue-600 dark:text-blue-400">الرد على {replyingToMessage.senderName}</span>
                  <p className="truncate text-[11px] mt-0.5">{replyingToMessage.text}</p>
                </div>
                <button 
                  onClick={() => setReplyingToMessage(null)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Chat Input Panel Controls */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {/* File Attachment Controls */}
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
                    title="إرفاق صورة أو فيديو"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
                    title="إرفاق مستند أو تقرير PDF / Word"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'image')}
                />
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'pdf')}
                />

                {/* Text Field */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="اكتب رسالتك التشغيلية هنا... (استخدم @ للإشارة لزميل)"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="w-full pr-3 pl-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-sans"
                  />
                </div>

                {/* Mic Record Button */}
                <button
                  onClick={handleToggleVoiceRecord}
                  className={`p-2.5 rounded-2xl transition-all cursor-pointer ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  title={isRecording ? 'إيقاف وإرسال التسجيل الصوتي الميداني' : 'تسجيل رسالة صوتية للموقع'}
                >
                  <Mic className="w-4.5 h-4.5" />
                </button>

                {/* Send button */}
                <button
                  onClick={() => handleSendMessage()}
                  className={`p-2.5 ${primaryBg} text-white rounded-2xl hover:opacity-90 shadow-md transition-all cursor-pointer shrink-0`}
                >
                  <Send className="w-4.5 h-4.5 transform rotate-180" />
                </button>
              </div>

              {/* Recording Status HUD */}
              {isRecording && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 animate-pulse">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping"></span>
                    <span>جاري تسجيل صوتك الميداني...</span>
                  </div>
                  <span className="font-mono font-bold">{formatTime(recordingSeconds)}</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-slate-900/10">
            <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-3" />
            <span className="font-bold text-slate-700 dark:text-slate-200">بوابة الاتصالات والتعاون الميداني</span>
            <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              اختر أي محادثة، مجموعة، أو مشروع من القائمة الجانبية لبدء التنسيق وتداول الملفات والصوتيات بين المهندسين والإدارة المالية وقسم المبيعات.
            </p>
          </div>
        )}
      </div>

      {/* 🚀 IMAGE FULL PREVIEW MODAL */}
      {activeImagePreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setActiveImagePreview(null)}
              className="absolute -top-10 -left-2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeImagePreview} 
              alt="معاينة الملف" 
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* 🚀 FORWARD MESSAGE DIALOG MODAL */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 text-right">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">تحويل الرسالة إلى...</h4>
              <button onClick={() => setForwardingMessage(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl mb-4 truncate">
              {forwardingMessage.text}
            </p>
            <span className="text-[10px] font-bold text-slate-500 block mb-2">اختر المحادثة المستهدفة:</span>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {conversations.map(c => (
                <div
                  key={c.id}
                  onClick={() => executeForward(c.id)}
                  className="p-2.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2.5 cursor-pointer text-xs font-bold transition-colors"
                >
                  <img src={getConversationDetails(c).avatar} alt={c.name} className="w-7 h-7 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                  <span>{getConversationDetails(c).name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 EDIT MESSAGE MODAL DIALOG */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl w-full max-w-md border border-slate-100 dark:border-slate-800 text-right">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mb-3">تعديل الرسالة المرسلة</h4>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-50 rounded-xl"
              >
                إلغاء
              </button>
              <button 
                onClick={saveEditedMessage}
                className={`px-4 py-2 text-xs font-bold text-white ${primaryBg} rounded-xl shadow-md`}
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 GROUP DETAILS & DATA INTEGRATION INFO */}
      {showGroupInfo && activeConv && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 text-right overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">معلومات التكامل والتعاون</h4>
              <button onClick={() => setShowGroupInfo(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center p-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <img src={getConversationDetails(activeConv).avatar} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover shadow-md mb-2" referrerPolicy="no-referrer" />
              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{getConversationDetails(activeConv).name}</span>
              <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-md mt-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>
                {activeConv.groupType === 'project' ? 'مجموعة مشروع' : activeConv.groupType === 'task' ? 'نقاش مهمة' : activeConv.groupType === 'department' ? 'مجموعة قسم' : 'محادثة خاصة'}
              </span>
            </div>

            {/* Linked coreops object info if any */}
            {activeConv.linkedEntityId && (
              <div className="my-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block">التكامل التشغيلي المرتبط:</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                  {activeConv.groupType === 'project' ? '🏗️ مشروع:' : '📋 مهمة:'} {activeConv.linkedEntityName}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  يتم توجيه وأرشفة كافة الاتصالات والملفات والمستندات بخصوص هذه الغرفة بداخل بطاقة المشروع/المهمة الميدانية للرجوع إليها مستقبلاً.
                </p>
              </div>
            )}

            <span className="text-[10px] font-bold text-slate-500 block mb-2 mt-4">أعضاء مجموعة التعاون ({activeConv.memberIds.length}):</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {employees.filter(e => activeConv.memberIds.includes(e.id)).map(emp => (
                <div key={emp.id} className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <img src={emp.avatar} alt="Avatar" className="w-7 h-7 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <span className="font-bold">{emp.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">
                    {emp.role === 'admin' ? 'مدير' : emp.role === 'engineer' ? 'مهندس ميدان' : emp.role === 'accountant' ? 'محاسب' : 'مبيعات'}
                  </span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowGroupInfo(false)}
              className="w-full mt-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* 🚀 CREATE NEW GROUP CHAT POPUP DIALOG */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateGroup} className="bg-white dark:bg-slate-900 p-5 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800 text-right overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">تأسيس مجموعة تعاون جديدة</h4>
              <button type="button" onClick={() => setShowCreateGroup(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">اسم المجموعة:</label>
                <input
                  type="text"
                  placeholder="مثال: قسم الطوارئ، فحص السلامة..."
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">تصنيف الغرفة:</label>
                <select
                  value={newGroupType}
                  onChange={(e) => setNewGroupType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                >
                  <option value="custom">مجموعة تعاون عامة</option>
                  <option value="department">مجموعة إدارة أو قسم</option>
                  <option value="project">تكامل مشروع ميداني</option>
                  <option value="task">تنسيق مهمة عمل محددة</option>
                </select>
              </div>

              {/* Link to actual projects if selected */}
              {(newGroupType === 'project' || newGroupType === 'task') && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">ربط بالمشروع القائم:</label>
                  <select
                    value={linkedEntityId}
                    onChange={(e) => setLinkedEntityId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                    required
                  >
                    <option value="">-- اختر المشروع للربط --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">تحديد الموظفين المشاركين:</span>
                <p className="text-[9px] text-slate-400 mb-2">اختر الموظفين لإضافتهم تلقائياً لغرفة التعاون:</p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {employees.map(emp => (
                    <div 
                      key={emp.id}
                      onClick={() => toggleGroupMemberSelection(emp.id)}
                      className={`p-2 rounded-xl flex items-center justify-between gap-2 text-xs cursor-pointer border ${newGroupMembers.includes(emp.id) ? 'bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:border-blue-900' : 'bg-slate-50/50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700'}`}
                    >
                      <div className="flex items-center gap-2">
                        <img src={emp.avatar} alt="Avatar" className="w-6 h-6 rounded-md object-cover" referrerPolicy="no-referrer" />
                        <span className="font-bold">{emp.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-400">
                        {emp.role === 'admin' ? '👑 إدارة' : emp.role === 'engineer' ? '👷 مهندس' : emp.role === 'accountant' ? '💰 محاسب' : '📢 مبيعات'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                type="button"
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:bg-slate-50 rounded-xl"
              >
                إلغاء
              </button>
              <button 
                type="submit"
                className={`px-5 py-2 text-xs font-bold text-white ${primaryBg} rounded-xl shadow-md`}
              >
                تأسيس المجموعة الآن
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🚀 DIRECT EMPLOYEE DIRECTORY (Floating Right Side Widget for quick message or view) */}
      <div className="w-full md:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-slate-800 dark:text-slate-100">دليل الموظفين والتشغيل</span>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">نشط الآن</span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto max-h-[300px] md:max-h-full">
          {employees.map(emp => (
            <div
              key={emp.id}
              onClick={() => handleStartDirectChat(emp)}
              className="p-2.5 bg-slate-50/50 hover:bg-blue-50/40 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                <div className="min-w-0 text-right">
                  <span className="text-xs font-bold truncate block">{emp.name}</span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    {emp.role === 'admin' ? 'مدير نظام' : emp.role === 'engineer' ? 'مهندس ميداني' : emp.role === 'accountant' ? 'محاسب مالي' : 'مبيعات وتسويق'}
                  </span>
                </div>
              </div>
              <button 
                className="p-1 bg-white dark:bg-slate-700 hover:bg-blue-500 hover:text-white rounded-lg text-slate-400 shadow-xs cursor-pointer shrink-0"
                title="إرسال رسالة مباشرة"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
