# server/Dockerfile

# Use an official Node.js LTS version (Alpine for smaller size)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock) first
# This allows Docker to cache the dependency installation step
COPY package*.json ./

# Install dependencies (including devDependencies needed for TS compilation)
RUN npm install

# Copy the rest of the application source code (including tsconfig.json, src/, etc.)
COPY . .

# Compile TypeScript to JavaScript using the build script from package.json
# This expects tsconfig.json to output files to a 'dist' directory
RUN npm run build

# ---- Optional: Production Optimization ----
# If you want a smaller final image, remove development dependencies after building
# RUN npm prune --production
# -----------------------------------------

# Inform Docker that the container listens on port 8000 at runtime
# Note: This must match the internal port your application actually listens on
# AND the target port in your docker-compose.yml ports mapping (e.g., "8000:8000")
EXPOSE 8000

# Define the command to run the compiled application
# This uses the "start" script defined in package.json, which should execute the compiled JS
# Assumes the compiled entry point is dist/index.js
CMD [ "npm", "start" ]