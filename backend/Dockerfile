FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY src ./src

EXPOSE 5000

CMD ["node", "src/index.js"]
