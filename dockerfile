FROM node:22-alpine

WORKDIR /app

COPY ./package.json .

RUN npm install pnpm -g
RUN pnpm install

COPY . .

RUN npx prisma generate
RUN pnpm build

EXPOSE 3000

CMD [ "pnpm","start","--port","3000"]