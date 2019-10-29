FROM circleci/node:10.15.3

WORKDIR /home/circleci

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

CMD ["npm", "start"]
