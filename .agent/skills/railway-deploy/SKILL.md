---
name: railway-deploy
description: Tooling and procedures for deploying the Gravity Claw AI agent to Railway.
---

# Railway Deployment Skill

This skill enables the agent to manage the deployment lifecycle of Gravity Claw on Railway.

## Capabilities

- **Project Linking**: Link the local directory to a Railway project.
- **Environment Management**: Set and list environment variables on Railway.
- **Deployment Control**: Pause/Resume the Railway service and trigger new deployments.
- **Monitoring**: Inspect build and runtime logs on Railway.

## Standard Operating Procedure (SOP)

### 1. Dev Mode (Pause Live Bot)
Before testing locally, always pause the live Railway service to avoid token conflicts.
```bash
railway down
```

### 2. Local Testing
Run the local dev server and interact with the bot.
```bash
npm run dev
```

### 3. Deployment
Deploy changes to Railway in detached mode.
```bash
npx tsc --noEmit
railway up --detach
```

### 4. Verification
Monitor logs to ensure a successful startup.
```bash
railway logs --lines 50
```
