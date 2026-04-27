FROM node:22-alpine AS production

WORKDIR /app/api

COPY package.json .

RUN npm install

COPY . .

CMD ["npm", "run", "start"]