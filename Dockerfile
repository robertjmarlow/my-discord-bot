FROM node:22-alpine

# TODO use a builder
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm install
RUN npm run build

ENTRYPOINT ["node", "dist/index.js"]
