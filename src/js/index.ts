import fs from 'node:fs';
import { get } from 'node:https';
import { join, dirname } from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, MessageFlags, TextChannel } from 'discord.js';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { parse } from 'csv-parse';
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

  get(process.env.badWordList, res => {
    console.log(`statusCode: [${res.statusCode}]`);
    console.log(`headers['content-type']: [${res.headers['content-type']}]`);

    if (res.statusCode !== 200) {
      console.error("Failed to retrieve profanity .csv");
      return;
    }

    let profanityCsv = '';
    res
      .setEncoding('utf8')
      .on('data', chunk => profanityCsv += chunk)
      .on('end', () => {
        console.log(`Read [${profanityCsv.length}] characters of bad words csv`);

        const parser = parse({
          delimiter: ","
        });
        parser.on('readable', () => {
          let record;
          while ((record = parser.read()) !== null) {
            if (record.length === 9) {
              // const badWord = new BadWord(record[0], [], [], record[7], BadWordSeverity.Mild);
              const badWord = BadWord.BadWordFactory(record);
              console.log(`Adding [${badWord}]`);
              badWords.push(record);
            }
          }
        });
        parser.write(profanityCsv);
        parser.end();

        // await finished(parser);
      }
    );
  });

  return badWords;
}

const badWords = await getBadWords();
// console.log(badWords);

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
