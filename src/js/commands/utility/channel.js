import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('channel')
  .setDescription('Provides information about the channel.');
export async function execute(interaction) {
  await interaction.reply(`This channel id is \`${interaction.channelId}\``);
}
