FROM node:alpine

RUN set NODE_ENV=develop
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm i

COPY . /app
COPY wait-for.sh /app/wait-for.sh
RUN chmod +x /app/wait-for.sh

RUN chmod 777 /usr/local/bin/docker-entrypoint.sh \
    && ln -s /usr/local/bin/docker-entrypoint.sh /


EXPOSE 3000