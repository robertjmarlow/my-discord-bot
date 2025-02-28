import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, TextChannel } from 'discord.js';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { BadWord } from './obj/bad-word.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const foldersPath = join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

async function getCommands() {
  const commands = new Collection();

  for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      await import(filePath).then((command) => {
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
          commands.set(command.data.name, command);
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      });
    }
  }

  return commands;
}

async function getBadWords() {
  const badWords: BadWord[] = [];

  try {
    console.log(`Getting bad words from "${process.env.badWordList}".`);

    const profanityCsvResponse = await axios.get(process.env.badWordList);
    if (profanityCsvResponse.status === 200) {
      const profanityCsv: string = profanityCsvResponse.data;

      console.log(`Read [${profanityCsv.length}] characters of bad words csv.`);

      const profanityRecords: any[] = parse(profanityCsv, {
        columns: true
      });

      console.log(`Read [${profanityRecords.length}] bad words records.`);

      console.log(`profanityRecords[0]: ${BadWord.BadWordFactory(profanityRecords[0])}`)
      console.log(`profanityRecords[1]: ${BadWord.BadWordFactory(profanityRecords[1])}`)
      console.log(`profanityRecords[2]: ${BadWord.BadWordFactory(profanityRecords[2])}`)

    } else {
      console.error(`Got a ${profanityCsvResponse.status} when reading bad words csv.`);
    }
  } catch (error) {
    console.error(error);
  }

  return badWords;
}

const badWords = await getBadWords();
console.log(`badWords: [${badWords}]`);

client.commands = await getCommands();

// TODO put all these event handlers in their own files / directory?
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) {
    console.log("ignoring bot-generated message");
    return;
  }

  console.log(`user ${message.author.username} said "${message.content}" in channel [${message.channelId}]`);

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

  console.log(`user ${interaction.user.username} used "/${interaction.commandName}" in channel [${interaction.channelId}]`);

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
});

client.login(process.env.token);
