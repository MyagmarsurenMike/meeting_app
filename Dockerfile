# Use an official Node.js runtime as a parent image
FROM node:20-alpine3.18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install project dependencies
# If you're using npm:
RUN npm install --legacy-peer-deps
# If you're using yarn:
# RUN yarn install

# Copy the rest of your application's code
COPY . .

RUN npm run build
# Make your app's port available to the outside world
# Replace 3000 with your application's port if different
EXPOSE 3000

# Define the command to run your app
# Replace 'your-start-script' with the actual script defined in your package.json (e.g., "start", "dev")
# Or use a direct command like "node server.js"
CMD [ "npm", "run", "start" ]