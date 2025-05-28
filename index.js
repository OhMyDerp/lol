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

const STAR_EMOJI = '⭐';
const STAR_THRESHOLD = 3;
const STARBOARD_CHANNEL_NAME = 'starboard';

// Track which messages have been posted
const postedMessages = new Set();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    // Ignore partials
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();

    if (reaction.emoji.name !== STAR_EMOJI) return;

    const message = reaction.message;

    // Only post if threshold met and not already posted
    if (reaction.count >= STAR_THRESHOLD && !postedMessages.has(message.id)) {
      const starboardChannel = message.guild.channels.cache.find(
        channel => channel.name === STARBOARD_CHANNEL_NAME && channel.isTextBased()
      );

      if (!starboardChannel) {
        console.warn(`Starboard channel "${STARBOARD_CHANNEL_NAME}" not found.`);
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xffac33)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(message.content || '*No text content*')
        .setTimestamp(message.createdAt)
        .setFooter({ text: `⭐ ${reaction.count} | #${message.channel.name}` });

      if (message.attachments.size > 0) {
        const image = message.attachments.first().url;
        embed.setImage(image);
      }

      await starboardChannel.send({ embeds: [embed] });
      postedMessages.add(message.id);
    }
  } catch (err) {
    console.error('Error handling reaction:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
