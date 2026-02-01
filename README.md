# Gmail AI Agent

A Gmail-resident AI agent that owns objectives, decides next actions, and operates autonomously within Gmail. This is **not** a copilot or RPA tool—it's a true AI agent that makes decisions and takes actions.

## Core Principles

- **Agent owns objectives**: The agent takes ownership of goals and works toward them
- **Agent decides actions**: The agent autonomously determines what to do next
- **Gmail-only operation**: All actions are scoped to Gmail
- **Structured state**: Uses DOM + data, NOT screenshots
- **Asynchronous drafting**: Creates drafts without blocking
- **Asks when uncertain**: Never guesses—asks clarifying questions
- **Never auto-sends**: Emails are always drafts, never sent automatically
- **No assumptions**: Never guesses when information is missing

## Architecture

```
src/
├── core/
│   ├── Agent.ts           # Main agent class
│   ├── DecisionEngine.ts  # Decision-making logic
│   ├── ActionExecutor.ts  # Action execution
│   └── StateManager.ts    # State persistence
├── gmail/
│   ├── GmailClient.ts     # Gmail API client
│   └── DOMParser.ts       # DOM state extraction
├── auth/
│   └── AuthHelper.ts      # OAuth2 authentication
└── types/
    └── index.ts           # TypeScript types
```

## Key Components

### Agent
The main agent class that:
- Manages objectives
- Coordinates decision-making
- Handles human approvals
- Manages questions and answers

### Decision Engine
Determines what action to take next based on:
- Current objective
- Available context
- State analysis
- Ambiguity detection

### Action Executor
Executes actions on Gmail:
- **Safe by default**: Irreversible actions require approval
- **Never auto-sends**: All emails are drafts
- **Structured operations**: Uses Gmail API, not DOM manipulation

### Gmail Client
Structured interface to Gmail:
- Uses Gmail API (not screenshots)
- Extracts structured data
- Supports all email operations
- DOM parsing for interface state

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Gmail API credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Download `credentials.json` to project root

3. Build:
```bash
npm run build
```

## Usage

### Basic Usage

```typescript
import { Agent, GmailClient, AuthHelper } from './src/index.js';

// Authenticate
const auth = await AuthHelper.authenticate();
const gmailClient = new GmailClient(auth);

// Create agent
const agent = new Agent(gmailClient);

// Set an objective - agent will decide what to do
await agent.setObjective('Draft an email to john@example.com about the meeting');

// Check for pending approvals
const approvals = agent.getPendingApprovals();
if (approvals.length > 0) {
  // Approve actions
  await agent.approveAction(approvals[0].id);
}

// Check for questions
const questions = agent.getUnansweredQuestions();
if (questions.length > 0) {
  // Answer questions
  await agent.answerQuestion(questions[0].id, 'The meeting is at 3pm');
}
```

### Command Line

```bash
npm start "Check my unread emails"
npm start "Draft email to alice@example.com subject: Project Update body: Here's the status"
npm start "Search for emails from bob@example.com"
```

## Action Types

The agent can perform these actions:

- `read_email` - Read a specific email
- `search_emails` - Search for emails
- `draft_email` - Create a draft (never auto-sent)
- `update_draft` - Update an existing draft
- `delete_draft` - Delete a draft (requires approval)
- `add_label` - Add label to email (requires approval)
- `remove_label` - Remove label from email
- `mark_read` - Mark email as read
- `mark_unread` - Mark email as unread
- `archive` - Archive email (requires approval)
- `move_to_trash` - Move to trash (requires approval)
- `ask_question` - Ask for clarification
- `wait_for_input` - Wait for human input

## Safety Mechanisms

### Irreversible Actions
These actions **always** require approval:
- `delete_draft`
- `move_to_trash`
- `archive`
- `add_label` (configurable)

### Never Auto-Send
- All `draft_email` actions create drafts only
- No action type exists for sending emails
- Human must manually send drafts

### Ambiguity Detection
When information is missing or ambiguous:
- Agent creates `ask_question` actions
- Blocks execution until clarified
- Never guesses or assumes

## Decision Flow

1. **Objective Set**: Agent receives an objective
2. **State Update**: Agent updates state from Gmail
3. **Analysis**: Decision engine analyzes state and objective
4. **Ambiguity Check**: Detects missing information
5. **Action Decision**: Determines next action
6. **Approval Check**: Checks if action requires approval
7. **Execution**: Executes action or waits for approval
8. **Repeat**: Continues until objective complete or blocked

## State Management

Agent state includes:
- Current objective
- Email context (current email, thread, inbox)
- Pending actions
- Completed actions
- Unanswered questions
- Last update timestamp

State is persisted and can be restored across sessions.

## Development

```bash
# Development mode with watch
npm run dev

# Build
npm run build

# Run
npm start
```

## Example Objectives

```
"Draft an email to team@example.com about the project status"
"Check my unread emails and summarize them"
"Find emails from last week about the budget"
"Organize emails from john@example.com with label 'Important'"
"Read the latest email from alice@example.com"
```

## Limitations

- Requires Gmail API credentials
- OAuth2 flow must be completed manually (first time)
- DOM parsing works with Gmail's current structure
- State persistence is in-memory (file-based coming soon)

## Contributing

This is a foundational implementation. Key areas for extension:
- Enhanced decision engine with LLM integration
- Better ambiguity detection
- File-based state persistence
- Web UI for approvals and questions
- More sophisticated email parsing
- Thread analysis and context building

## License

MIT
