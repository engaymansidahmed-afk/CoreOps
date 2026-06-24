export type ChatAttachmentType = 'image' | 'video' | 'pdf' | 'document' | 'voice';

export interface ChatAttachment {
  id: string;
  name: string;
  type: ChatAttachmentType;
  url: string;
  size: string;
  duration?: number; // for voice messages
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string; // ISO string
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  edited?: boolean;
  deleted?: boolean;
  pinned?: boolean;
  readBy: string[]; // employee ids
  deliveredTo: string[]; // employee ids
  attachments?: ChatAttachment[];
  mentions?: string[]; // employee ids
}

export interface Conversation {
  id: string;
  name: string; // Dynamic for private (other user name) or static for group
  type: 'private' | 'group';
  groupType?: 'department' | 'project' | 'task' | 'work_order' | 'custom';
  linkedEntityId?: string; // Project ID, Task ID, Lead ID, Advance ID
  linkedEntityName?: string;
  avatar?: string;
  memberIds: string[];
  adminIds: string[];
  lastMessage?: Message;
  archivedBy?: string[]; // list of user ids who archived this
  pinnedBy?: string[]; // list of user ids who pinned this
  typingUserIds?: string[]; // current typing users
  createdAt: string;
}

export interface ChatAuditLog {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  action: 'create_group' | 'delete_message' | 'pin_message' | 'upload_file' | 'add_member' | 'remove_member' | 'archive_chat';
  details: string;
}
