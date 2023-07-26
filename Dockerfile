FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
RUN npm install -g pm2 mocha knex

# Bundle app source
COPY . /usr/src/app
COPY docker-files/env /usr/src/app/.env

EXPOSE 3000 8001 8443
CMD [ "pm2-docker", "index.js" ]