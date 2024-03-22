FROM node:20.11-slim as builder

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run prisma:push 

FROM node:20.11-slim

WORKDIR /usr/src/app

COPY --from=builder /usr/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000 3001

CMD [ "npm", "run", "start" ]