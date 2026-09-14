export const JUDICIAL_AUTHORITIES = [
  'محكمة',
  'مجلس قضاء',
  'محكمة عليا',
  'محكمة إدارية',
] as const;

export const CASE_STATUSES = [
  'سارية',
  'مؤجلة',
  'منجزة',
  'ملغاة',
  'استئناف',
  'طعن',
] as const;

export const SESSION_RESULTS = [
  'تأجيل',
  'حكم',
  'براءة',
  'إدانة',
  'استئناف',
  'شطب',
  'أخرى',
] as const;

export const ATTACHMENT_CATEGORIES = [
  'استدعاء',
  'حكم',
  'قرار',
  'محضر جلسة',
  'استئناف',
  'طعن',
  'مراسلة',
  'أخرى',
] as const;

export const USER_ROLES = [
  { value: 'manager', label: 'مدير', description: 'كامل الصلاحيات' },
  { value: 'employee', label: 'موظف', description: 'إضافة وتعديل' },
  { value: 'reader', label: 'قارئ فقط', description: 'مشاهدة وطباعة' },
] as const;

export const ALERT_DAYS = [30, 15, 7, 3, 1] as const;

export type JudicialAuthority = (typeof JUDICIAL_AUTHORITIES)[number];
export type CaseStatus = (typeof CASE_STATUSES)[number];
export type SessionResult = (typeof SESSION_RESULTS)[number];
export type AttachmentCategory = (typeof ATTACHMENT_CATEGORIES)[number];
export type UserRole = 'manager' | 'employee' | 'reader';

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'سارية': { bg: 'bg-primary-50', text: 'text-primary-700', dot: 'bg-primary-500' },
  'مؤجلة': { bg: 'bg-accent-50', text: 'text-accent-700', dot: 'bg-accent-500' },
  'منجزة': { bg: 'bg-success-50', text: 'text-success-700', dot: 'bg-success-500' },
  'ملغاة': { bg: 'bg-error-50', text: 'text-error-700', dot: 'bg-error-500' },
  'استئناف': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  'طعن': { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
};

export const SESSION_RESULT_COLORS: Record<string, { bg: string; text: string }> = {
  'تأجيل': { bg: 'bg-accent-50', text: 'text-accent-700' },
  'حكم': { bg: 'bg-primary-50', text: 'text-primary-700' },
  'براءة': { bg: 'bg-success-50', text: 'text-success-700' },
  'إدانة': { bg: 'bg-error-50', text: 'text-error-700' },
  'استئناف': { bg: 'bg-purple-50', text: 'text-purple-700' },
  'شطب': { bg: 'bg-neutral-100', text: 'text-neutral-600' },
  'أخرى': { bg: 'bg-neutral-100', text: 'text-neutral-600' },
};

export const ROLE_LABELS: Record<string, string> = {
  manager: 'مدير',
  employee: 'موظف',
  reader: 'قارئ فقط',
};

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  manager: { bg: 'bg-primary-50', text: 'text-primary-700' },
  employee: { bg: 'bg-success-50', text: 'text-success-700' },
  reader: { bg: 'bg-neutral-100', text: 'text-neutral-600' },
};
