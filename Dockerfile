FROM node:16
WORKDIR /usr/src/app
COPY  . .
RUN npm ci
CMD npm run migrate
CMD npm run start