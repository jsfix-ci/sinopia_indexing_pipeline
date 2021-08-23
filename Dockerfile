FROM circleci/node:14.11.0

ARG HONEYBADGER_API_KEY
ENV HONEYBADGER_API_KEY=$HONEYBADGER_API_KEY

WORKDIR /home/circleci

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["npm", "start"]
