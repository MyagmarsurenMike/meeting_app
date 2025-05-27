FROM node:20-alpine3.18

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

COPY .env.local .env.local  # Ensure environment variables are included

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
