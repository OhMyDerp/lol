const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const STAR_THRESHOLD = 3;
const STARBOARD_CHANNEL_NAME = 'starboard';
const postedMessages = new Set();

// Emojis to ignore
const excludedEmojis = new Set([
  '👎', '💩', '❌', '😡', '🚫', '😠', '🤮', '🖕'
]);

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    const message = reaction.message;
    const emoji = reaction.emoji.toString();

    if (excludedEmojis.has(emoji)) return;
    if (reaction.count < STAR_THRESHOLD) return;
    if (postedMessages.has(message.id)) return;

    const starboardChannel = message.guild.channels.cache.find(
      channel => channel.name === STARBOARD_CHANNEL_NAME && channel.isTextBased()
    );

    if (!starboardChannel) {
      console
