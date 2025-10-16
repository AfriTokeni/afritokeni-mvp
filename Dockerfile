FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Generate package-lock.json and install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the backend
RUN npm run backend:build

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "backend:start"]