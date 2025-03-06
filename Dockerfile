# build node_modues
FROM node:22-alpine AS build-node-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# build runtime
FROM node:22-alpine AS build-runtime-stage
WORKDIR /app
COPY --from=build-node-stage /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm run build

# run it
FROM node:22-alpine
WORKDIR /app
COPY --from=build-node-stage /app/node_modules ./node_modules
COPY --from=build-runtime-stage /app/dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
