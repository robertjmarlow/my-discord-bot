# build node_modues
FROM node:22-alpine AS build-node-stage
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable
RUN yarn set version stable
RUN yarn install

# build runtime
FROM node:22-alpine AS build-runtime-stage
WORKDIR /app
COPY --from=build-node-stage /app/node_modules ./node_modules
COPY package.json yarn.lock tsconfig.json ./
COPY src ./src
RUN corepack enable
RUN yarn install
RUN yarn build

# run it
FROM node:22-alpine
WORKDIR /app
COPY --from=build-node-stage /app/node_modules ./node_modules
COPY --from=build-runtime-stage /app/dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
