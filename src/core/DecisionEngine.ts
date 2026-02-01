/**
 * Decision engine - agent decides what to do next
 */

import { AgentState, AgentDecision, Action, ActionType } from '../types/index.js';

export class DecisionEngine {
  /**
   * Main decision function - agent decides next action
   */
  async decide(state: AgentState): Promise<AgentDecision> {
    if (!state.currentObjective) {
      return {
        nextAction: null,
        reasoning: 'No objective set',
        confidence: 0,
        requiresClarification: false,
        blockingIssues: ['No objective set'],
      };
    }

    // Analyze current state and objective
    const analysis = this.analyzeState(state);

    // Check for ambiguity or missing information
    if (analysis.hasAmbiguity) {
      return {
        nextAction: this.createQuestionAction(analysis.ambiguousPoints),
        reasoning: `Need clarification: ${analysis.ambiguousPoints.join(', ')}`,
        confidence: 0.3,
        requiresClarification: true,
        blockingIssues: analysis.ambiguousPoints,
      };
    }

    // Determine next action based on objective and state
    const nextAction = this.determineNextAction(state, analysis);

    if (!nextAction) {
      return {
        nextAction: null,
        reasoning: 'No clear next action',
        confidence: 0,
        requiresClarification: false,
        blockingIssues: ['Cannot determine next action'],
      };
    }

    return {
      nextAction,
      reasoning: this.generateReasoning(state, nextAction),
      confidence: this.calculateConfidence(state, nextAction),
      requiresClarification: false,
      blockingIssues: [],
    };
  }

  private analyzeState(state: AgentState): StateAnalysis {
    const hasObjective = !!state.currentObjective;
    const hasContext = !!state.context.currentEmail || state.context.inboxState.recentEmails.length > 0;
    const hasPendingActions = state.pendingActions.length > 0;
    const hasUnansweredQuestions = state.questions.some(q => !q.answered);

    const ambiguousPoints: string[] = [];

    if (!hasContext && state.currentObjective?.description.includes('email')) {
      ambiguousPoints.push('No email context available');
    }

    if (hasUnansweredQuestions) {
      ambiguousPoints.push('Unanswered questions pending');
    }

    return {
      hasObjective,
      hasContext,
      hasPendingActions,
      hasUnansweredQuestions,
      hasAmbiguity: ambiguousPoints.length > 0,
      ambiguousPoints,
    };
  }

  private determineNextAction(state: AgentState, analysis: StateAnalysis): Action | null {
    const objective = state.currentObjective!;
    const objectiveLower = objective.description.toLowerCase();

    // Pattern matching on objective to determine action
    if (objectiveLower.includes('read') || objectiveLower.includes('check')) {
      if (!state.context.currentEmail && state.context.inboxState.recentEmails.length > 0) {
        return this.createAction('read_email', {
          emailId: state.context.inboxState.recentEmails[0].id,
        });
      }
    }

    if (objectiveLower.includes('draft') || objectiveLower.includes('compose') || objectiveLower.includes('write')) {
      // Check if we have enough information to draft
      if (this.hasDraftInfo(state)) {
        return this.createAction('draft_email', this.extractDraftParams(state));
      } else {
        // Need more information
        return this.createQuestionAction(['Missing information to draft email']);
      }
    }

    if (objectiveLower.includes('search') || objectiveLower.includes('find')) {
      return this.createAction('search_emails', {
        query: this.extractSearchQuery(objective.description),
      });
    }

    if (objectiveLower.includes('label') || objectiveLower.includes('organize')) {
      if (state.context.currentEmail) {
        return this.createAction('add_label', {
          emailId: state.context.currentEmail.id,
          label: this.extractLabel(objective.description),
        }, true); // Requires approval
      }
    }

    // Default: read recent email to gather context
    if (state.context.inboxState.recentEmails.length > 0) {
      return this.createAction('read_email', {
        emailId: state.context.inboxState.recentEmails[0].id,
      });
    }

    return null;
  }

  private hasDraftInfo(state: AgentState): boolean {
    const objective = state.currentObjective!.description.toLowerCase();
    // Check if objective contains recipient and subject information
    const hasRecipient = objective.includes('to:') || objective.includes('@');
    const hasSubject = objective.includes('subject:') || objective.includes('about:');
    return hasRecipient && hasSubject;
  }

  private extractDraftParams(state: AgentState): Record<string, unknown> {
    const objective = state.currentObjective!.description;
    const params: Record<string, unknown> = {};

    // Extract recipient
    const toMatch = objective.match(/to:\s*([^\s,]+)/i) || objective.match(/([\w.-]+@[\w.-]+\.\w+)/);
    if (toMatch) {
      params.to = toMatch[1];
    }

    // Extract subject
    const subjectMatch = objective.match(/subject:\s*([^\n]+)/i) || objective.match(/about:\s*([^\n]+)/i);
    if (subjectMatch) {
      params.subject = subjectMatch[1].trim();
    }

    // Extract body hints
    const bodyMatch = objective.match(/body:\s*([^\n]+)/i) || objective.match(/message:\s*([^\n]+)/i);
    if (bodyMatch) {
      params.body = bodyMatch[1].trim();
    }

    return params;
  }

  private extractSearchQuery(description: string): string {
    // Extract search terms from objective
    const queryMatch = description.match(/search\s+for\s+(.+)/i) || 
                      description.match(/find\s+(.+)/i);
    return queryMatch ? queryMatch[1].trim() : description;
  }

  private extractLabel(description: string): string {
    const labelMatch = description.match(/label[:\s]+([^\s]+)/i) || 
                      description.match(/organize\s+as\s+([^\s]+)/i);
    return labelMatch ? labelMatch[1].trim() : 'Important';
  }

  private createAction(
    type: ActionType,
    parameters: Record<string, unknown>,
    requiresApproval: boolean = false
  ): Action {
    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      description: this.generateActionDescription(type, parameters),
      requiresApproval: this.isIrreversibleAction(type) || requiresApproval,
      status: 'pending',
      parameters,
      createdAt: new Date(),
    };
  }

  private createQuestionAction(ambiguousPoints: string[]): Action {
    return this.createAction('ask_question', {
      questions: ambiguousPoints,
    });
  }

  private isIrreversibleAction(type: ActionType): boolean {
    const irreversibleActions: ActionType[] = [
      'delete_draft',
      'move_to_trash',
      'archive',
    ];
    return irreversibleActions.includes(type);
  }

  private generateActionDescription(type: ActionType, parameters: Record<string, unknown>): string {
    switch (type) {
      case 'read_email':
        return `Read email ${parameters.emailId}`;
      case 'draft_email':
        return `Draft email to ${parameters.to} about ${parameters.subject}`;
      case 'search_emails':
        return `Search emails: ${parameters.query}`;
      case 'add_label':
        return `Add label ${parameters.label} to email`;
      default:
        return `Execute ${type}`;
    }
  }

  private generateReasoning(state: AgentState, action: Action): string {
    const objective = state.currentObjective!.description;
    return `Objective: ${objective}. Next action: ${action.description}`;
  }

  private calculateConfidence(state: AgentState, action: Action): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence if we have context
    if (state.context.currentEmail) {
      confidence += 0.2;
    }

    // Decrease confidence if action requires approval (more uncertainty)
    if (action.requiresApproval) {
      confidence -= 0.1;
    }

    // Increase confidence if we have completed similar actions
    const similarActions = state.completedActions.filter(
      a => a.type === action.type
    );
    confidence += Math.min(similarActions.length * 0.1, 0.2);

    return Math.max(0, Math.min(1, confidence));
  }
}

interface StateAnalysis {
  hasObjective: boolean;
  hasContext: boolean;
  hasPendingActions: boolean;
  hasUnansweredQuestions: boolean;
  hasAmbiguity: boolean;
  ambiguousPoints: string[];
}
