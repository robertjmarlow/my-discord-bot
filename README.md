Basically going through [the discord.js Guide](https://discordjs.guide/) and then adding a bunch of other stuff.

# Prereqs

1. Clone this repo.
1. Create a file called `.env` at the root of the repo. This needs to be filled in with enviornment variables.
    ```
    token=
    clientId=
    guildId=
    badWordList=
    badWordMultiplier=
    ```

# Build + Run with Node

One-time setup steps:

1. Install [nvm](https://github.com/nvm-sh/nvm)
1. Tell nvm to use the correct version of node:
    ```sh
    nvm use
    ```
1. Install the [TypeScript](https://www.typescriptlang.org/) compiler globally:
    ```sh
    npm install -g tsc
    ```
1. Install [yarn](https://yarnpkg.com/):
    ```sh
    corepack enable
    yarn install
    ```

Build and run with:

```sh
yarn build-and-run
```

# Build + Run with Docker

One-time setup steps:

1. Install [Docker](https://www.docker.com/)

Build the image with:

```sh
docker build -t mydiscordbot .
```

Run the image with:

```sh
docker run --env-file=".env" -d --rm mydiscordbot:latest
```
