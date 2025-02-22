import { SlashCommandBuilder } from 'discord.js';

const allowedChannels = new Map([
  ["1331279251797970995", "zoomy zooms"],
  ["1342637090256589001", "test bot channel"]
]);

export const data = new SlashCommandBuilder()
  .setName('selectiveping')
  .setDescription('Only responds to specific channels.');
export async function execute(interaction) {
  const channelName = allowedChannels.get(interaction.channelId);
  if (channelName != undefined) {
    await interaction.reply(`Hello, ${channelName} :wave:`);
  } else {
    await interaction.reply("I won't respond to this channel :angry:");
  }
}
