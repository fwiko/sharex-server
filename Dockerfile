FROM node:16.15-alpine

workdir /usr/src/app
COPY package*.json ./

RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && npm i -g npm \
    && npm ci --only=production \
    && apk del .gyp

COPY ./ ./

EXPOSE 8080

CMD ["node", "src/app.js"]