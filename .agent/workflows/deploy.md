---
description: How to deploy the Gravity Claw application to Railway.
---

# Railway Deployment Workflow

1. Stop the live bot instance on Railway to prevent token clashing.
// turbo
```bash
railway down
```

2. Run local type checking to ensure code stability.
// turbo
```bash
npx tsc --noEmit
```

3. Deploy the latest code to Railway in detached mode.
// turbo
```bash
railway up --detach
```

4. Verify the deployment by checking the latest logs.
// turbo
```bash
railway logs --lines 50
```
