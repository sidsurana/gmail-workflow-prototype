/**
 * Basic usage example for Gmail AI Agent
 */

import { Agent, GmailClient, AuthHelper } from '../index.js';

async function example() {
  console.log('=== Gmail AI Agent - Basic Usage Example ===\n');

  try {
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const auth = await AuthHelper.authenticate();
    const gmailClient = new GmailClient(auth);
    console.log('✓ Authenticated\n');

    // Step 2: Create agent
    console.log('2. Creating agent...');
    const agent = new Agent(gmailClient);
    console.log('✓ Agent created\n');

    // Step 3: Set an objective
    console.log('3. Setting objective...');
    const objective = 'Check my unread emails';
    await agent.setObjective(objective);
    console.log(`✓ Objective set: "${objective}"\n`);

    // Step 4: Check for pending approvals
    console.log('4. Checking for pending approvals...');
    const pendingApprovals = agent.getPendingApprovals();
    if (pendingApprovals.length > 0) {
      console.log(`⚠️  Found ${pendingApprovals.length} action(s) requiring approval:`);
      pendingApprovals.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.description} (${action.type})`);
        console.log(`      ID: ${action.id}`);
      });
      console.log('\n   To approve: await agent.approveAction(actionId)');
    } else {
      console.log('✓ No actions requiring approval\n');
    }

    // Step 5: Check for questions
    console.log('5. Checking for questions...');
    const questions = agent.getUnansweredQuestions();
    if (questions.length > 0) {
      console.log(`❓ Found ${questions.length} question(s):`);
      questions.forEach((question, index) => {
        console.log(`   ${index + 1}. ${question.question}`);
        console.log(`      ID: ${question.id}`);
      });
      console.log('\n   To answer: await agent.answerQuestion(questionId, answer)');
    } else {
      console.log('✓ No questions\n');
    }

    // Step 6: Display state
    console.log('6. Current agent state:');
    const state = agent.getState();
    console.log(`   Objective: ${state.currentObjective?.description || 'None'}`);
    console.log(`   Status: ${state.currentObjective?.status || 'N/A'}`);
    console.log(`   Unread emails: ${state.context.inboxState.unreadCount}`);
    console.log(`   Completed actions: ${state.completedActions.length}`);
    console.log(`   Pending actions: ${state.pendingActions.length}`);

    console.log('\n=== Example Complete ===');

  } catch (error) {
    console.error('Error in example:', error);
    throw error;
  }
}

// Run example
example().catch(console.error);
