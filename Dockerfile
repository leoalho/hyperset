FROM node:22-alpine
WORKDIR /usr/src/app
COPY  . .

RUN apk update && apk upgrade
RUN apk add --no-cache sqlite
RUN crontab cron
RUN npm ci

CMD npm run start