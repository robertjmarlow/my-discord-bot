import fs from 'node:fs';
import { join, dirname } from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, Channel, TextChannel } from 'discord.js';
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

const wordSeparator = /\b(\w+)\b/g;

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

async function getBadWords(): Promise<Map<string, BadWord>> {
  const badWords: Map<string, BadWord> = new Map();

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

      for (let badWordIdx = 0; badWordIdx < profanityRecords.length; badWordIdx++) {
        const badWord: BadWord = BadWord.BadWordFactory(profanityRecords[badWordIdx]);

        if (badWord !== undefined) {
          badWords.set(badWord.getText(), badWord);
        } else {
          console.warn(`I had a problem reading ${profanityRecords[badWordIdx]}.`);
        }
      }

      console.log(`Added ${badWords.size} bad words.`);
    } else {
      console.error(`Got a ${profanityCsvResponse.status} when reading bad words csv.`);
    }
  } catch (error) {
    console.error(error);
  }

  return badWords;
}

const badWords = await getBadWords();

client.commands = await getCommands();

// TODO put all these event handlers in their own files / directory?
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) {
    console.log("Ignoring bot-generated message.");
    return;
  }

  if (!(client.channels.cache.get(message.channelId) instanceof TextChannel)) {
    console.log("Ignoring message from non-text channel.");
    return;
  }

  const textChannel = client.channels.cache.get(message.channelId) as TextChannel;
  console.log(`user ${message.author.globalName} said "${message.content}" in channel "${textChannel.name}".`);

  // just general and zoomy zooms for now
  if (message.channelId === "1331275006138781711" || message.channelId === "1331279251797970995") {
    if (message.content.toLowerCase().includes("bad bot")) {
      const channel = client.channels.cache.get(message.channelId);
      (channel as TextChannel).send(":sob:");
    } else if (message.content.toLowerCase().includes("good bot")) {
      const channel = client.channels.cache.get(message.channelId);
      (channel as TextChannel).send(":smiley:");
    }

    const badWordsInMessage: BadWord[] = [];
    const messageWords: string[] = message.content.toLowerCase().match(wordSeparator);

    // go through every word in the message looking for bad words
    for (let wordIdx = 0; wordIdx < messageWords.length; wordIdx++) {
      const badWord: BadWord = badWords.get(messageWords[wordIdx]);

      if (badWord !== undefined) {
        badWordsInMessage.push(badWord);
      }
    }

    // did the message have a bad word?
    if (badWordsInMessage.length > 0) {
      const badWordsStr = badWordsInMessage.map((badWordInMessage) => `"${badWordInMessage.getText()}"`).join(", ");
      console.log(`user ${message.author.globalName} said ${badWordsInMessage.length} bad word(s) in channel "${textChannel.name}": [${badWordsInMessage}], [${badWordsStr}].`);

      const totalFine: number = badWordsInMessage.reduce((totalFine, nextBadWord) => totalFine + (nextBadWord.getSeverity() * Number(process.env.badWordMultiplier)), 0)
      const messageStr = `user **${message.author.globalName}** has been fined **€${totalFine.toLocaleString()}** for using the following words: ${badWordsStr}.`;

      console.log(messageStr);
      // textChannel.send(messageStr);
    }
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  console.log(`user ${interaction.user.globalName} used "/${interaction.commandName}" in channel [${interaction.channelId}].`);

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
