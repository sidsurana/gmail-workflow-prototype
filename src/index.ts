/**
 * Gmail AI Agent - Main Entry Point
 * 
 * This agent:
 * - Owns objectives
 * - Decides next actions
 * - Operates only inside Gmail
 * - Uses structured state (DOM + data), NOT screenshots
 * - Drafts work asynchronously
 * - Asks clarifying questions when uncertain
 * - Never auto-sends emails
 * - Never guesses when information is missing
 */

import { Agent } from './core/Agent.js';
import { GmailClient } from './gmail/GmailClient.js';
import { AuthHelper } from './auth/AuthHelper.js';

async function main() {
  console.log('Gmail AI Agent - Starting...');

  try {
    // Authenticate
    const auth = await AuthHelper.authenticate();
    const gmailClient = new GmailClient(auth);

    // Create agent
    const agent = new Agent(gmailClient);

    // Example: Set an objective
    // The agent will decide what actions to take
    const objective = process.argv[2] || 'Check my unread emails';
    
    console.log(`Setting objective: ${objective}`);
    await agent.setObjective(objective);

    // Agent will automatically decide and act
    // Check for pending approvals
    const pendingApprovals = agent.getPendingApprovals();
    if (pendingApprovals.length > 0) {
      console.log('\n⚠️  Actions requiring approval:');
      pendingApprovals.forEach((action) => {
        console.log(`  - ${action.description} (${action.type})`);
        console.log(`    ID: ${action.id}`);
      });
      console.log('\nUse agent.approveAction(actionId) to approve');
    }

    // Check for questions
    const questions = agent.getUnansweredQuestions();
    if (questions.length > 0) {
      console.log('\n❓ Questions needing answers:');
      questions.forEach((question) => {
        console.log(`  - ${question.question}`);
        console.log(`    ID: ${question.id}`);
      });
      console.log('\nUse agent.answerQuestion(questionId, answer) to answer');
    }

    // Display current state
    const state = agent.getState();
    console.log('\n📊 Current State:');
    console.log(`  Objective: ${state.currentObjective?.description || 'None'}`);
    console.log(`  Status: ${state.currentObjective?.status || 'N/A'}`);
    console.log(`  Unread emails: ${state.context.inboxState.unreadCount}`);
    console.log(`  Completed actions: ${state.completedActions.length}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('index')) {
  main().catch(console.error);
}

export { Agent, GmailClient, AuthHelper };
