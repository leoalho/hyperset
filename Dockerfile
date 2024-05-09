FROM node:22-alpine
WORKDIR /usr/src/app
COPY  . .
RUN npm ci
CMD npm run start