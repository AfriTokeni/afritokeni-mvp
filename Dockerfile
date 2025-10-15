FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Generate package-lock.json and install dependencies
RUN npm install --legacy-peer-deps --omit=dev

# Copy source code
COPY . .

# Build the backend
RUN npm run build:backend

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "run", "start:backend"]