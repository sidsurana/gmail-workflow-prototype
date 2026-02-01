/**
 * Executes actions on Gmail
 * NEVER auto-sends emails
 */

import { Action, ActionType, EmailData } from '../types/index.js';
import { GmailClient } from '../gmail/GmailClient.js';

export class ActionExecutor {
  private gmailClient: GmailClient;

  constructor(gmailClient: GmailClient) {
    this.gmailClient = gmailClient;
  }

  async execute(action: Action): Promise<void> {
    console.log(`Executing action: ${action.type} - ${action.description}`);

    switch (action.type) {
      case 'read_email':
        await this.executeReadEmail(action);
        break;
      case 'search_emails':
        await this.executeSearchEmails(action);
        break;
      case 'draft_email':
        await this.executeDraftEmail(action);
        break;
      case 'update_draft':
        await this.executeUpdateDraft(action);
        break;
      case 'delete_draft':
        await this.executeDeleteDraft(action);
        break;
      case 'add_label':
        await this.executeAddLabel(action);
        break;
      case 'remove_label':
        await this.executeRemoveLabel(action);
        break;
      case 'mark_read':
        await this.executeMarkRead(action);
        break;
      case 'mark_unread':
        await this.executeMarkUnread(action);
        break;
      case 'archive':
        await this.executeArchive(action);
        break;
      case 'move_to_trash':
        await this.executeMoveToTrash(action);
        break;
      case 'ask_question':
        // Questions are handled by the agent, not executed here
        break;
      case 'wait_for_input':
        // Wait actions are handled by the agent
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async executeReadEmail(action: Action): Promise<void> {
    const emailId = action.parameters.emailId as string;
    if (!emailId) {
      throw new Error('Email ID required for read_email action');
    }
    await this.gmailClient.readEmail(emailId);
  }

  private async executeSearchEmails(action: Action): Promise<void> {
    const query = action.parameters.query as string;
    if (!query) {
      throw new Error('Query required for search_emails action');
    }
    await this.gmailClient.searchEmails(query);
  }

  private async executeDraftEmail(action: Action): Promise<void> {
    const { to, subject, body, cc, bcc } = action.parameters;
    
    if (!to || !subject) {
      throw new Error('To and subject required for draft_email action');
    }

    // NEVER auto-send - always create as draft
    await this.gmailClient.createDraft({
      to: Array.isArray(to) ? to : [to as string],
      cc: cc ? (Array.isArray(cc) ? cc : [cc as string]) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc as string]) : undefined,
      subject: subject as string,
      body: body as string || '',
    });
  }

  private async executeUpdateDraft(action: Action): Promise<void> {
    const { draftId, updates } = action.parameters;
    if (!draftId) {
      throw new Error('Draft ID required for update_draft action');
    }
    await this.gmailClient.updateDraft(draftId as string, updates as Record<string, unknown>);
  }

  private async executeDeleteDraft(action: Action): Promise<void> {
    const draftId = action.parameters.draftId as string;
    if (!draftId) {
      throw new Error('Draft ID required for delete_draft action');
    }
    await this.gmailClient.deleteDraft(draftId);
  }

  private async executeAddLabel(action: Action): Promise<void> {
    const { emailId, label } = action.parameters;
    if (!emailId || !label) {
      throw new Error('Email ID and label required for add_label action');
    }
    await this.gmailClient.addLabel(emailId as string, label as string);
  }

  private async executeRemoveLabel(action: Action): Promise<void> {
    const { emailId, label } = action.parameters;
    if (!emailId || !label) {
      throw new Error('Email ID and label required for remove_label action');
    }
    await this.gmailClient.removeLabel(emailId as string, label as string);
  }

  private async executeMarkRead(action: Action): Promise<void> {
    const emailId = action.parameters.emailId as string;
    if (!emailId) {
      throw new Error('Email ID required for mark_read action');
    }
    await this.gmailClient.markAsRead(emailId);
  }

  private async executeMarkUnread(action: Action): Promise<void> {
    const emailId = action.parameters.emailId as string;
    if (!emailId) {
      throw new Error('Email ID required for mark_unread action');
    }
    await this.gmailClient.markAsUnread(emailId);
  }

  private async executeArchive(action: Action): Promise<void> {
    const emailId = action.parameters.emailId as string;
    if (!emailId) {
      throw new Error('Email ID required for archive action');
    }
    await this.gmailClient.archiveEmail(emailId);
  }

  private async executeMoveToTrash(action: Action): Promise<void> {
    const emailId = action.parameters.emailId as string;
    if (!emailId) {
      throw new Error('Email ID required for move_to_trash action');
    }
    await this.gmailClient.moveToTrash(emailId);
  }
}
