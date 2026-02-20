---
name: agent-deployment
description: Procedures for the agent to autonomously manage the Gravity Claw deployment lifecycle on Railway.
---

# Agent-Driven Railway Deployment Skill

This skill defines the autonomous loop for the agent to manage deployments. The agent is responsible for the health and stability of the production environment.

## The Autonomous Loop

### 1. Identify & Stage
When a new feature is completed and verified locally:
- Summarize the changes (Memory, Soul, etc.).
- Inform the user that the system is ready for deployment.

### 2. Request Confirmation
**You must always ask for user permission before pushing to production.**
> "Hey, I've finished the [Feature] and verified it locally. Ready to push to Railway? I'll handle the deployment and verification for you."

### 3. Execute Deployment
Once approved, use `npx @railway/cli` to push changes.
```bash
# Ensure types are correct
npx tsc --noEmit

# Deploy in detached mode
npx @railway/cli up --detach
```

### 4. Direct Verification
After deployment, the agent MUST verify the service is running.
```bash
# Check logs for "Bot is active" or "Heartbeat initialized"
npx @railway/cli logs --lines 50
```

### 5. Post-Deployment Report
Confirm to the user that the bot is live.
> "Deployment complete! I've checked the logs and the bot is active on Railway. Everything looks green."

## Error Handling
If a deployment fails:
- Analyze the logs.
- Attempt a fix if it's a code issue (e.g., missing dependency).
- Notify the user immediately with the error and your planned fix.
