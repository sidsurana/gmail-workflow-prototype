/**
 * Core types for the Gmail AI Agent
 */

export interface AgentState {
  currentObjective: Objective | null;
  context: EmailContext;
  pendingActions: Action[];
  completedActions: Action[];
  questions: Question[];
  lastUpdate: Date;
}

export interface Objective {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailContext {
  currentEmail: EmailData | null;
  thread: EmailData[];
  inboxState: InboxState;
}

export interface EmailData {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  date: Date;
  labels: string[];
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface InboxState {
  unreadCount: number;
  recentEmails: EmailData[];
  labels: string[];
}

export interface Action {
  id: string;
  type: ActionType;
  description: string;
  requiresApproval: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  parameters: Record<string, unknown>;
  createdAt: Date;
  executedAt?: Date;
}

export type ActionType =
  | 'read_email'
  | 'search_emails'
  | 'draft_email'
  | 'update_draft'
  | 'delete_draft'
  | 'add_label'
  | 'remove_label'
  | 'mark_read'
  | 'mark_unread'
  | 'archive'
  | 'move_to_trash'
  | 'ask_question'
  | 'wait_for_input';

export interface Question {
  id: string;
  question: string;
  context: string;
  type: 'clarification' | 'approval' | 'information';
  createdAt: Date;
  answered: boolean;
  answer?: string;
}

export interface DOMState {
  currentView: 'inbox' | 'email' | 'compose' | 'drafts';
  selectedEmailId?: string;
  draftId?: string;
  domSnapshot: Record<string, unknown>;
}

export interface AgentDecision {
  nextAction: Action | null;
  reasoning: string;
  confidence: number; // 0-1
  requiresClarification: boolean;
  blockingIssues: string[];
}
