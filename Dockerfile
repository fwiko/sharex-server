FROM node:16.15-alpine

workdir /usr/src/app
COPY package*.json ./

RUN apk add --no-cache --virtual .gyp python3 make g++ \
    && npm ci --only=production \
    && apk del .gyp \
    && apk add --no-cache ffmpeg

COPY . .

EXPOSE 80

CMD ["node", "src/app.js"]