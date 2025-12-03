// Shared TypeScript types for Bulk Email feature

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  unsubscribed?: boolean;
}

export interface GetContactsResponse {
  success: boolean;
  contacts: Contact[];
  totalContacts: number;
  error?: string;
}

export interface SendTestEmailRequest {
  testEmail: string;
  subject: string;
  htmlContent: string;
}

export interface SendTestEmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
  error?: string;
  details?: any;
}

export interface SendBulkEmailRequest {
  subject: string;
  htmlContent: string;
  fromName?: string;
  replyTo?: string;
}

export interface BatchResult {
  batchNumber: number;
  sent: number;
  failed: number;
  errors?: any[];
}

export interface SendBulkEmailResponse {
  success: boolean;
  message: string;
  results: {
    total: number;
    sent: number;
    failed: number;
    batches: BatchResult[];
    errors: any[];
  };
  error?: string;
  details?: any;
}

export interface BatchProgressUpdate {
  currentBatch: number;
  totalBatches: number;
  progress: number; // 0-100
  sent: number;
  failed: number;
}

export interface ScheduledEmail {
  id: string;
  subject: string;
  html_content: string;
  scheduled_date: string;
  scheduled_time: string;
  scheduled_datetime: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
  sent_at?: string;
  total_recipients: number;
  sent_count?: number;
  failed_count?: number;
  error_message?: string;
  created_by?: string;
}

export interface ScheduleEmailRequest {
  subject: string;
  htmlContent: string;
  scheduledDate: string; // YYYY-MM-DD format
  scheduledTime: string; // HH:MM format (24-hour)
}

export interface ScheduleEmailResponse {
  success: boolean;
  message: string;
  scheduledEmail?: ScheduledEmail;
  error?: string;
}

export interface GetScheduledEmailsResponse {
  success: boolean;
  scheduledEmails: ScheduledEmail[];
  error?: string;
}
