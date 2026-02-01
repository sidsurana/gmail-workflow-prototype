/**
 * Core AI Agent class
 * Owns objectives and decides next actions
 */

import { AgentState, Objective, AgentDecision, Action, Question } from '../types/index.js';
import { GmailClient } from '../gmail/GmailClient.js';
import { StateManager } from './StateManager.js';
import { DecisionEngine } from './DecisionEngine.js';
import { ActionExecutor } from './ActionExecutor.js';

export class Agent {
  private state: AgentState;
  private gmailClient: GmailClient;
  private stateManager: StateManager;
  private decisionEngine: DecisionEngine;
  private actionExecutor: ActionExecutor;

  constructor(gmailClient: GmailClient) {
    this.gmailClient = gmailClient;
    this.stateManager = new StateManager();
    this.decisionEngine = new DecisionEngine();
    this.actionExecutor = new ActionExecutor(gmailClient);
    
    this.state = {
      currentObjective: null,
      context: {
        currentEmail: null,
        thread: [],
        inboxState: {
          unreadCount: 0,
          recentEmails: [],
          labels: [],
        },
      },
      pendingActions: [],
      completedActions: [],
      questions: [],
      lastUpdate: new Date(),
    };
  }

  /**
   * Set a new objective for the agent
   */
  async setObjective(description: string): Promise<void> {
    const objective: Objective = {
      id: `obj_${Date.now()}`,
      description,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.state.currentObjective = objective;
    await this.stateManager.saveState(this.state);
    
    // Trigger decision cycle
    await this.decideAndAct();
  }

  /**
   * Main decision loop - agent decides what to do next
   */
  async decideAndAct(): Promise<void> {
    if (!this.state.currentObjective) {
      return;
    }

    // Update state from Gmail
    await this.updateStateFromGmail();

    // Agent decides next action
    const decision = await this.decisionEngine.decide(this.state);

    if (decision.requiresClarification) {
      await this.askClarification(decision);
      return;
    }

    if (decision.blockingIssues.length > 0) {
      console.log('Blocking issues:', decision.blockingIssues);
      return;
    }

    if (decision.nextAction) {
      await this.executeAction(decision.nextAction);
    }
  }

  /**
   * Update agent state from Gmail
   */
  private async updateStateFromGmail(): Promise<void> {
    const inboxState = await this.gmailClient.getInboxState();
    this.state.context.inboxState = inboxState;
    this.state.lastUpdate = new Date();
  }

  /**
   * Execute an action (with approval if required)
   */
  private async executeAction(action: Action): Promise<void> {
    // Check if action requires approval
    if (action.requiresApproval) {
      // Add to pending actions and wait for approval
      this.state.pendingActions.push(action);
      await this.stateManager.saveState(this.state);
      return;
    }

    // Execute immediately
    try {
      await this.actionExecutor.execute(action);
      action.status = 'executed';
      action.executedAt = new Date();
      this.state.completedActions.push(action);
      this.state.pendingActions = this.state.pendingActions.filter(a => a.id !== action.id);
      await this.stateManager.saveState(this.state);
    } catch (error) {
      action.status = 'failed';
      console.error('Action execution failed:', error);
      await this.stateManager.saveState(this.state);
    }
  }

  /**
   * Ask for clarification when uncertain
   */
  private async askClarification(decision: AgentDecision): Promise<void> {
    if (!decision.nextAction) {
      return;
    }

    const question: Question = {
      id: `q_${Date.now()}`,
      question: decision.reasoning,
      context: JSON.stringify(decision),
      type: 'clarification',
      createdAt: new Date(),
      answered: false,
    };

    this.state.questions.push(question);
    await this.stateManager.saveState(this.state);
  }

  /**
   * Approve a pending action
   */
  async approveAction(actionId: string): Promise<void> {
    const action = this.state.pendingActions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    action.status = 'approved';
    await this.executeAction(action);
  }

  /**
   * Reject a pending action
   */
  async rejectAction(actionId: string): Promise<void> {
    const action = this.state.pendingActions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    action.status = 'rejected';
    this.state.pendingActions = this.state.pendingActions.filter(a => a.id !== actionId);
    await this.stateManager.saveState(this.state);
    
    // Decide next action after rejection
    await this.decideAndAct();
  }

  /**
   * Answer a question
   */
  async answerQuestion(questionId: string, answer: string): Promise<void> {
    const question = this.state.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error(`Question ${questionId} not found`);
    }

    question.answered = true;
    question.answer = answer;
    await this.stateManager.saveState(this.state);
    
    // Continue decision cycle with new information
    await this.decideAndAct();
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get pending actions requiring approval
   */
  getPendingApprovals(): Action[] {
    return this.state.pendingActions.filter(a => a.requiresApproval && a.status === 'pending');
  }

  /**
   * Get unanswered questions
   */
  getUnansweredQuestions(): Question[] {
    return this.state.questions.filter(q => !q.answered);
  }
}
