FROM node:alpine

RUN set NODE_ENV=develop
COPY ./package.json /app/package.json
WORKDIR /app
COPY . /app
COPY wait-for.sh /app/wait-for.sh
RUN chmod +x /app/wait-for.sh

RUN apk add lame
COPY audiowaveform.sh /app/audiowaveform.sh
RUN chmod +x audiowaveform.sh
RUN ./audiowaveform.sh
RUN npm i

RUN chmod 777 /usr/local/bin/docker-entrypoint.sh \
    && ln -s /usr/local/bin/docker-entrypoint.sh /


EXPOSE 3000
