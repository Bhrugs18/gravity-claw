# Production Dockerfile for Gravity Claw
FROM node:20-slim

# Install system dependencies if any are needed (e.g., for audio processing)
# RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Ensure soul.md and mcp.json (if exists) are available
# These are copied by the COPY . . command

# Production command as requested by the user
CMD ["npx", "tsx", "src/index.ts"]
