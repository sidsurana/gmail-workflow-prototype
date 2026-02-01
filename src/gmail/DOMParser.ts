/**
 * DOM Parser for Gmail interface
 * Extracts structured state from DOM, NOT screenshots
 */

export class DOMParser {
  /**
   * Parse Gmail DOM to extract structured state
   */
  parse(dom: Document): Record<string, unknown> {
    const state: Record<string, unknown> = {};

    // Detect current view
    state.currentView = this.detectCurrentView(dom);

    // Extract email list if in inbox
    if (state.currentView === 'inbox') {
      state.emailList = this.extractEmailList(dom);
    }

    // Extract email content if viewing an email
    if (state.currentView === 'email') {
      state.emailContent = this.extractEmailContent(dom);
      state.selectedEmailId = this.extractEmailId(dom);
    }

    // Extract draft state if in compose
    if (state.currentView === 'compose' || state.currentView === 'drafts') {
      state.draftState = this.extractDraftState(dom);
    }

    // Extract navigation state
    state.navigation = this.extractNavigation(dom);

    return state;
  }

  private detectCurrentView(dom: Document): 'inbox' | 'email' | 'compose' | 'drafts' {
    // Check for compose window
    if (dom.querySelector('[role="dialog"][aria-label*="Compose"]')) {
      return 'compose';
    }

    // Check for draft view
    if (dom.querySelector('[data-draft-id]')) {
      return 'drafts';
    }

    // Check for email view
    if (dom.querySelector('[role="main"] [data-message-id]')) {
      return 'email';
    }

    // Default to inbox
    return 'inbox';
  }

  private extractEmailList(dom: Document): Array<Record<string, unknown>> {
    const emails: Array<Record<string, unknown>> = [];
    
    // Gmail uses specific selectors for email list items
    const emailItems = dom.querySelectorAll('[role="main"] tr[data-thread-perm-id]');
    
    emailItems.forEach((item) => {
      const email: Record<string, unknown> = {};
      
      // Extract email ID
      const threadId = item.getAttribute('data-thread-perm-id');
      if (threadId) {
        email.threadId = threadId;
      }

      // Extract subject
      const subjectEl = item.querySelector('[data-thread-perm-id] span[email]');
      if (subjectEl) {
        email.subject = subjectEl.textContent?.trim();
      }

      // Extract sender
      const senderEl = item.querySelector('[email]');
      if (senderEl) {
        email.from = senderEl.getAttribute('email') || senderEl.textContent?.trim();
      }

      // Extract snippet
      const snippetEl = item.querySelector('.bog');
      if (snippetEl) {
        email.snippet = snippetEl.textContent?.trim();
      }

      // Check if unread
      email.isUnread = item.classList.contains('zE') || item.querySelector('.bqX') !== null;

      if (email.threadId) {
        emails.push(email);
      }
    });

    return emails;
  }

  private extractEmailContent(dom: Document): Record<string, unknown> {
    const content: Record<string, unknown> = {};

    // Extract subject
    const subjectEl = dom.querySelector('h2[data-thread-perm-id]');
    if (subjectEl) {
      content.subject = subjectEl.textContent?.trim();
    }

    // Extract sender
    const senderEl = dom.querySelector('[email]');
    if (senderEl) {
      content.from = senderEl.getAttribute('email') || senderEl.textContent?.trim();
    }

    // Extract body
    const bodyEl = dom.querySelector('[role="main"] .ii.gt, [role="main"] .a3s');
    if (bodyEl) {
      content.body = bodyEl.textContent?.trim();
      content.bodyHTML = bodyEl.innerHTML;
    }

    // Extract date
    const dateEl = dom.querySelector('[data-thread-perm-id] + div span');
    if (dateEl) {
      content.date = dateEl.textContent?.trim();
    }

    return content;
  }

  private extractEmailId(dom: Document): string | undefined {
    // Try to extract from various Gmail DOM patterns
    const threadIdEl = dom.querySelector('[data-thread-perm-id]');
    if (threadIdEl) {
      return threadIdEl.getAttribute('data-thread-perm-id') || undefined;
    }

    // Alternative: extract from URL or other attributes
    const messageIdEl = dom.querySelector('[data-message-id]');
    if (messageIdEl) {
      return messageIdEl.getAttribute('data-message-id') || undefined;
    }

    return undefined;
  }

  private extractDraftState(dom: Document): Record<string, unknown> {
    const draft: Record<string, unknown> = {};

    // Extract draft ID
    const draftIdEl = dom.querySelector('[data-draft-id]');
    if (draftIdEl) {
      draft.draftId = draftIdEl.getAttribute('data-draft-id');
    }

    // Extract to field
    const toEl = dom.querySelector('[name="to"]') as HTMLInputElement;
    if (toEl) {
      draft.to = toEl.value;
    }

    // Extract subject
    const subjectEl = dom.querySelector('[name="subjectbox"]') as HTMLInputElement;
    if (subjectEl) {
      draft.subject = subjectEl.value;
    }

    // Extract body
    const bodyEl = dom.querySelector('[role="textbox"][aria-label*="Message Body"]') as HTMLTextAreaElement;
    if (bodyEl) {
      draft.body = bodyEl.value;
    }

    return draft;
  }

  private extractNavigation(dom: Document): Record<string, unknown> {
    const nav: Record<string, unknown> = {};

    // Extract current label/folder
    const activeLabel = dom.querySelector('[role="navigation"] [aria-current="page"]');
    if (activeLabel) {
      nav.activeLabel = activeLabel.textContent?.trim();
    }

    // Extract unread count
    const unreadEl = dom.querySelector('[data-unread-count]');
    if (unreadEl) {
      nav.unreadCount = parseInt(unreadEl.getAttribute('data-unread-count') || '0', 10);
    }

    return nav;
  }
}
