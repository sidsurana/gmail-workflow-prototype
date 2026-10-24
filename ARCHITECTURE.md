> Current status: this is a deterministic, unfinished prototype. OAuth first consent, approval transitions and durable persistence are incomplete. Original architecture notes below describe intent; see README for actual behavior.

# Architecture Overview

## System Design

The Gmail AI Agent is built with a clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                      Agent (Core)                        │
│  - Owns objectives                                       │
│  - Coordinates decision-making                          │
│  - Manages approvals and questions                      │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼─────────┐
│ Decision    │  │ Action         │
│ Engine      │  │ Executor       │
│             │  │                │
│ - Analyzes  │  │ - Executes     │
│   state     │  │   actions      │
│ - Detects   │  │ - Never        │
│   ambiguity │  │   auto-sends   │
│ - Decides   │  │ - Requires     │
│   actions   │  │   approvals    │
└─────────────┘  └────────────────┘
       │                │
       └───────┬────────┘
               │
      ┌────────▼─────────┐
      │   Gmail Client   │
      │                  │
      │ - Gmail API      │
      │ - DOM Parser     │
      │ - Structured     │
      │   state          │
      └──────────────────┘
```

## Data Flow

1. **Objective Input** → Agent receives objective
2. **State Update** → Agent fetches current Gmail state
3. **Decision** → Decision Engine analyzes and decides next action
4. **Approval Check** → If irreversible, requires human approval
5. **Execution** → Action Executor performs the action
6. **State Update** → Agent updates internal state
7. **Repeat** → Continues until objective complete

## Key Design Decisions

### 1. Agent-Owned Objectives
- Agent maintains ownership of objectives
- Tracks progress and status
- Can handle multiple objectives (future enhancement)

### 2. Decision Engine
- Rule-based decision making (can be enhanced with LLM)
- Ambiguity detection built-in
- Confidence scoring for actions

### 3. Safety First
- Irreversible actions always require approval
- Never auto-sends emails
- Asks questions when uncertain

### 4. Structured State
- Uses Gmail API (not screenshots)
- DOM parsing for interface state
- Type-safe data structures

### 5. Asynchronous Operations
- All operations are async
- Non-blocking draft creation
- State updates don't block execution

## Component Responsibilities

### Agent (`core/Agent.ts`)
- Main orchestrator
- Manages lifecycle
- Handles approvals/questions
- Coordinates components

### DecisionEngine (`core/DecisionEngine.ts`)
- Analyzes current state
- Detects ambiguity
- Determines next action
- Generates reasoning

### ActionExecutor (`core/ActionExecutor.ts`)
- Executes actions safely
- Never auto-sends
- Validates parameters
- Error handling

### GmailClient (`gmail/GmailClient.ts`)
- Gmail API wrapper
- Structured data extraction
- All email operations
- DOM state integration

### DOMParser (`gmail/DOMParser.ts`)
- Parses Gmail DOM
- Extracts structured state
- Detects current view
- Extracts email data

### StateManager (`core/StateManager.ts`)
- State persistence
- Load/save operations
- State versioning (future)

## Action Lifecycle

```
Action Created
    ↓
Requires Approval? ──Yes──→ Pending Actions Queue
    │                           ↓
   No                    Human Approval
    ↓                           ↓
Execute Action          Approved? ──No──→ Rejected
    ↓                           │
Success? ──No──→ Failed         Yes
    │                           ↓
   Yes                    Execute Action
    ↓                           ↓
Completed Actions        Success? ──No──→ Failed
                              │
                             Yes
                              ↓
                        Completed Actions
```

## State Structure

```typescript
AgentState {
  currentObjective: Objective | null
  context: {
    currentEmail: EmailData | null
    thread: EmailData[]
    inboxState: {
      unreadCount: number
      recentEmails: EmailData[]
      labels: string[]
    }
  }
  pendingActions: Action[]
  completedActions: Action[]
  questions: Question[]
  lastUpdate: Date
}
```

## Extension Points

### 1. LLM Integration
- Replace rule-based decision engine
- Use LLM for action selection
- Better ambiguity detection
- Natural language understanding

### 2. Enhanced State Management
- Database persistence
- State versioning
- Multi-session support
- State recovery

### 3. Web UI
- Real-time approval interface
- Question answering UI
- Objective management
- State visualization

### 4. Advanced Features
- Multi-objective handling
- Priority queuing
- Learning from feedback
- Context memory

## Security Considerations

- OAuth2 for authentication
- Token storage (local file)
- No credential hardcoding
- Scope-limited permissions
- Approval gates for destructive actions

## Performance Considerations

- Async operations throughout
- Efficient state updates
- Batch operations where possible
- Caching of frequently accessed data
- Lazy loading of email content
