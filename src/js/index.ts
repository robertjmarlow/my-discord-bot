import { readdirSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, TextChannel } from 'discord.js';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import winston from 'winston';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.cli()
    }),
    new winston.transports.File({
      filename: 'logs/logs.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )}),
  ]
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const foldersPath = join(__dirname, 'commands');
const commandFolders = readdirSync(foldersPath).filter(folder => lstatSync(join(foldersPath, folder)).isDirectory());

async function getCommands() {
  const commands = new Collection();

  for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      await import(filePath).then((command) => {
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
          commands.set(command.data.name, command);
        } else {
          logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      });
    }
  }

  return commands;
}

client.commands = await getCommands();

// TODO put all these event handlers in their own files / directory?
client.once(Events.ClientReady, readyClient => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  // ignore bot-generated message
  // it'll probably end up in end endless loop otherwise
  if (message.author.bot) {
    logger.info("Ignoring bot-generated message.");
    return;
  }

  // ignore anything that's not from a text channel
  // not necessary to do anything else with the message
  if (!(client.channels.cache.get(message.channelId) instanceof TextChannel)) {
    logger.info("Ignoring message from non-text channel.");
    return;
  }

  const textChannel = client.channels.cache.get(message.channelId) as TextChannel;

  // ignore "empty messages", e.g. from image replies
  // not necessary to do anything else with the message
  if (message.content.trim().length === 0) {
    logger.info(`Ignoring empty message from user ${message.author.globalName} in channel "${textChannel.name}".`);
    return;
  }

  logger.info(`user ${message.author.globalName} said "${message.content}" in channel "${textChannel.name}".`);

  // just general and zoomy zooms for now
  if (message.channelId === "1331275006138781711" || message.channelId === "1331279251797970995") {
    if (message.content.toLowerCase().includes("bad bot")) {
      const channel = client.channels.cache.get(message.channelId);
      (channel as TextChannel).send(":sob:");
    } else if (message.content.toLowerCase().includes("good bot")) {
      const channel = client.channels.cache.get(message.channelId);
      (channel as TextChannel).send(":smiley:");
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  logger.info(`user ${interaction.user.globalName} used "/${interaction.commandName}" in channel [${interaction.channelId}].`);

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.token);
