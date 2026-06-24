/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProjectType = 'alarm' | 'firefighting' | 'generators' | 'maintenance';
export type ProjectStatus = 'active' | 'completed' | 'paused';

export interface Project {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budget: number;
  clientName: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  beforePhoto?: string;
  afterPhoto?: string;
  reportText?: string;
  clientSignature?: string;
  reportDate?: string;
}

export type AdvanceStatus = 'pending_admin' | 'pending_accountant' | 'approved' | 'rejected' | 'cleared';

export interface ClearanceInvoice {
  id: string;
  amount: number;
  invoiceNumber: string;
  photo: string;
  category: string;
  date: string;
  notes?: string;
}

export interface CashAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  reason: string;
  status: AdvanceStatus;
  requestDate: string;
  approvalDate?: string;
  clearanceDate?: string;
  clearanceInvoices: ClearanceInvoice[];
  differenceAmount?: number; // positive = employee returns money, negative = company owes employee
}

export type AssetStatus = 'available' | 'assigned' | 'damaged';

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  status: AssetStatus;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedDate?: string;
}

export type LeadStatus = 'new_lead' | 'assigned' | 'inspection' | 'quotation' | 'completed' | 'rejected';

export interface Lead {
  id: string;
  clientName: string;
  phone: string;
  locationName: string;
  latitude: number;
  longitude: number;
  serviceType: ProjectType;
  description: string;
  status: LeadStatus;
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  createdDate: string;
  quotationAmount?: number;
  quotationNotes?: string;
}

export interface DailyReport {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  accomplished: string;
  problems?: string;
  beforePhoto?: string;
  afterPhoto?: string;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  projectName?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: 'task' | 'advance' | 'lead' | 'system';
}

export type EmployeeRole = 'admin' | 'engineer' | 'accountant' | 'sales';

export interface Employee {
  id: string;
  name: string;
  code: string; // الرقم الوظيفي
  role: EmployeeRole;
  email: string;
  phone: string;
  avatar?: string;
  passwordHash?: string; // Hashed password
  mustChangePassword?: boolean; // Flag to force password change on first login
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  action: 'login_success' | 'login_failed' | 'password_changed' | 'password_reset' | 'rate_limit_locked' | 'unauthorized_access';
  username: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export type ThemeColor = 'blue' | 'green' | 'purple' | 'amber';
export type AppMode = 'light' | 'dark';

export interface UserSettings {
  themeColor: ThemeColor;
  appMode: AppMode;
  companyBranding: boolean;
}
