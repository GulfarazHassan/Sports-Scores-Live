FROM node:22-alpine AS Production

WORKDIR /app/client

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "run", "preview"]