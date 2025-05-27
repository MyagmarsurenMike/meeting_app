# Use an official Node.js runtime as a parent image
FROM node:20-alpine3.18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) first for better caching of dependencies
COPY package*.json ./

# Install project dependencies (npm or yarn)
# If you have complex dependencies, you might also consider `--legacy-peer-deps` if necessary
RUN npm ci --legacy-peer-deps
# Or use yarn (uncomment if using yarn)
# RUN yarn install --frozen-lockfile

# Copy the rest of your application's code
COPY . .

# Build the application
RUN npm run build

# Expose the port your app runs on (replace 3000 if necessary)
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]
