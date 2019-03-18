FROM circleci/node:10.11

WORKDIR /home/circleci

COPY . .

RUN npm install
