# Setup Guide

## Prerequisites

- Node.js 18+ installed
- Gmail account
- Google Cloud Project with Gmail API enabled

## Step 1: Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Download the credentials JSON file
   - Save it as `credentials.json` in the project root

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: First-Time Authentication

On first run, you'll need to complete the OAuth flow:

1. Run the agent:
```bash
npm start "Check my emails"
```

2. You'll see an authorization URL
3. Visit the URL in your browser
4. Authorize the application
5. Copy the authorization code
6. Paste it when prompted
7. The token will be saved to `token.json`

## Step 4: Verify Setup

Run the example:

```bash
npm run dev src/examples/basic-usage.ts
```

## Troubleshooting

### "Error loading credentials"
- Make sure `credentials.json` is in the project root
- Verify the file is valid JSON

### "Token not found"
- Complete the OAuth flow (see Step 3)
- Make sure `token.json` is created after authorization

### "Gmail API not enabled"
- Go to Google Cloud Console
- Enable Gmail API for your project

### Permission errors
- Make sure you granted all requested permissions during OAuth
- Delete `token.json` and re-authenticate if needed

## Next Steps

- Read the [README.md](./README.md) for usage examples
- Check [src/examples/](./src/examples/) for code examples
- Customize the agent behavior in [src/core/DecisionEngine.ts](./src/core/DecisionEngine.ts)
