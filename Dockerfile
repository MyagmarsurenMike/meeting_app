FROM node:20-alpine3.18

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

COPY .env .env

RUN npm run start

EXPOSE 3000

CMD ["npm", "start"]
