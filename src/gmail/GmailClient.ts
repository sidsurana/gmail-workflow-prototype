/**
 * Gmail API client
 * Uses structured state (DOM + data), NOT screenshots
 */

import { google } from 'googleapis';
import { EmailData, InboxState, Attachment } from '../types/index.js';
import { DOMParser } from './DOMParser.js';

export interface DraftParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
}

export class GmailClient {
  private gmail: ReturnType<typeof google.gmail>;
  private domParser: DOMParser;

  constructor(auth: any) {
    this.gmail = google.gmail({ version: 'v1', auth });
    this.domParser = new DOMParser();
  }

  /**
   * Get inbox state (structured data)
   */
  async getInboxState(): Promise<InboxState> {
    // Get unread count
    const unreadResponse = await this.gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
      maxResults: 1,
    });

    const unreadCount = unreadResponse.data.resultSizeEstimate || 0;

    // Get recent emails
    const recentResponse = await this.gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    const recentEmails: EmailData[] = [];
    if (recentResponse.data.messages) {
      for (const message of recentResponse.data.messages.slice(0, 10)) {
        const email = await this.getMessage(message.id!);
        if (email) {
          recentEmails.push(email);
        }
      }
    }

    // Get labels
    const labelsResponse = await this.gmail.users.labels.list({
      userId: 'me',
    });

    const labels = labelsResponse.data.labels?.map(l => l.name || '') || [];

    return {
      unreadCount,
      recentEmails,
      labels,
    };
  }

  /**
   * Get a specific email by ID
   */
  async getMessage(messageId: string): Promise<EmailData | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      if (!message) {
        return null;
      }

      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const body = this.extractBody(message.payload);
      const attachments = this.extractAttachments(message.payload);

      return {
        id: message.id || '',
        threadId: message.threadId || '',
        from: getHeader('from'),
        to: this.parseEmailList(getHeader('to')),
        cc: this.parseEmailList(getHeader('cc')),
        bcc: this.parseEmailList(getHeader('bcc')),
        subject: getHeader('subject'),
        body,
        date: new Date(parseInt(message.internalDate || '0')),
        labels: message.labelIds || [],
        isRead: !message.labelIds?.includes('UNREAD'),
        attachments,
      };
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  /**
   * Read an email (updates DOM state)
   */
  async readEmail(messageId: string): Promise<EmailData | null> {
    return this.getMessage(messageId);
  }

  /**
   * Search emails
   */
  async searchEmails(query: string): Promise<EmailData[]> {
    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 20,
    });

    const emails: EmailData[] = [];
    if (response.data.messages) {
      for (const message of response.data.messages) {
        const email = await this.getMessage(message.id!);
        if (email) {
          emails.push(email);
        }
      }
    }

    return emails;
  }

  /**
   * Create a draft (NEVER auto-send)
   */
  async createDraft(params: DraftParams): Promise<string> {
    const raw = this.createRawEmail(params);

    const response = await this.gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: raw,
        },
      },
    });

    return response.data.id || '';
  }

  /**
   * Update a draft
   */
  async updateDraft(draftId: string, updates: Record<string, unknown>): Promise<void> {
    // Get existing draft
    const draftResponse = await this.gmail.users.drafts.get({
      userId: 'me',
      id: draftId,
    });

    const existingMessage = draftResponse.data.message;
    if (!existingMessage) {
      throw new Error('Draft not found');
    }

    // Merge updates
    const params: DraftParams = {
      to: updates.to as string[] || this.parseEmailList(existingMessage.payload?.headers?.find(h => h.name === 'To')?.value || ''),
      subject: updates.subject as string || existingMessage.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
      body: updates.body as string || this.extractBody(existingMessage.payload),
    };

    if (updates.cc) {
      params.cc = updates.cc as string[];
    }
    if (updates.bcc) {
      params.bcc = updates.bcc as string[];
    }

    const raw = this.createRawEmail(params);

    await this.gmail.users.drafts.update({
      userId: 'me',
      id: draftId,
      requestBody: {
        id: draftId,
        message: {
          raw: raw,
        },
      },
    });
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    await this.gmail.users.drafts.delete({
      userId: 'me',
      id: draftId,
    });
  }

  /**
   * Add label to email
   */
  async addLabel(emailId: string, labelName: string): Promise<void> {
    // First, get or create the label
    const labelsResponse = await this.gmail.users.labels.list({
      userId: 'me',
    });

    let labelId = labelsResponse.data.labels?.find(l => l.name === labelName)?.id;

    if (!labelId) {
      // Create label if it doesn't exist
      const createResponse = await this.gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });
      labelId = createResponse.data.id || undefined;
    }

    if (!labelId) {
      throw new Error(`Could not create or find label: ${labelName}`);
    }

    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [labelId],
      },
    });
  }

  /**
   * Remove label from email
   */
  async removeLabel(emailId: string, labelName: string): Promise<void> {
    const labelsResponse = await this.gmail.users.labels.list({
      userId: 'me',
    });

    const labelId = labelsResponse.data.labels?.find(l => l.name === labelName)?.id;
    if (!labelId) {
      throw new Error(`Label not found: ${labelName}`);
    }

    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: [labelId],
      },
    });
  }

  /**
   * Mark email as read
   */
  async markAsRead(emailId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  }

  /**
   * Mark email as unread
   */
  async markAsUnread(emailId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: ['UNREAD'],
      },
    });
  }

  /**
   * Archive email
   */
  async archiveEmail(emailId: string): Promise<void> {
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        removeLabelIds: ['INBOX'],
      },
    });
  }

  /**
   * Move email to trash
   */
  async moveToTrash(emailId: string): Promise<void> {
    await this.gmail.users.messages.trash({
      userId: 'me',
      id: emailId,
    });
  }

  /**
   * Parse DOM state from Gmail interface
   */
  async parseDOMState(dom: Document): Promise<Record<string, unknown>> {
    return this.domParser.parse(dom);
  }

  // Private helper methods

  private extractBody(payload: any): string {
    if (!payload) {
      return '';
    }

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        if (part.mimeType === 'text/html' && part.body?.data) {
          // Prefer plain text, but use HTML if that's all we have
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Simple HTML stripping (in production, use a proper HTML parser)
          return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        }
      }
    }

    return '';
  }

  private extractAttachments(payload: any): Attachment[] {
    const attachments: Attachment[] = [];

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0,
          });
        }
      }
    }

    return attachments;
  }

  private parseEmailList(emailString: string): string[] {
    if (!emailString) {
      return [];
    }
    return emailString.split(',').map(e => e.trim());
  }

  private createRawEmail(params: DraftParams): string {
    const lines: string[] = [];

    lines.push(`To: ${params.to.join(', ')}`);
    if (params.cc && params.cc.length > 0) {
      lines.push(`Cc: ${params.cc.join(', ')}`);
    }
    if (params.bcc && params.bcc.length > 0) {
      lines.push(`Bcc: ${params.bcc.join(', ')}`);
    }
    lines.push(`Subject: ${params.subject}`);
    lines.push('Content-Type: text/plain; charset=utf-8');
    lines.push('');
    lines.push(params.body);

    const email = lines.join('\r\n');
    return Buffer.from(email).toString('base64url');
  }
}
