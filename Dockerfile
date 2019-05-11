FROM circleci/node:10.15.3

WORKDIR /home/circleci

COPY . .

RUN npm install

CMD ["npm", "start"]
