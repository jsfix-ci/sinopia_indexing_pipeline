FROM circleci/node:10.15.3

ARG HONEYBADGER_API_KEY

WORKDIR /home/circleci

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["npm", "start"]
