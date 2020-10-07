FROM node:alpine as buildengine

COPY . /app/
WORKDIR /app
RUN npm i
RUN npm run web
RUN chmod +x wait-for.sh

EXPOSE 3000