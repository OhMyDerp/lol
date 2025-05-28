const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const axios = require('axios');
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
const excludedEmojis = new Set(['👎', '💩', '❌', '😡', '🚫', '😠', '🤮', '🖕']);

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ⭐ STARBOARD FUNCTIONALITY
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

    if (!starboardChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffac33)
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp(message.createdAt)
      .setFooter({ text: `${emoji} ${reaction.count} | #${message.channel.name}` });

    if (message.content && message.content.trim().length > 0) {
      embed.setDescription(message.content);
    }

    const imageAttachment = message.attachments.find(att =>
      (att.contentType && att.contentType.startsWith('image/')) ||
      att.url.match(/\.(png|jpe?g|gif|webp)$/i)
    );

    if (imageAttachment) {
      embed.setImage(imageAttachment.url);
    }

    if (embed.data.description || embed.data.image) {
      await starboardChannel.send({ embeds: [embed] });
      postedMessages.add(message.id);
    }
  } catch (err) {
    console.error('❌ Error handling reaction:', err);
  }
});

// 🎸 GEESE TOUR COMMAND
client.on('messageCreate', async message => {
  if (message.content.toLowerCase() === '!geese tour') {
    const appId = 'geese-discord-bot';
    const artistName = 'geese';

    try {
      const response = await axios.get(
        `https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}/events?app_id=${appId}`
      );
      const events = response.data;

      if (!Array.isArray(events) || events.length === 0) {
        return message.channel.send('📭 No upcoming Geese tour dates found.');
      }

      const tourList = events.slice(0, 10).map(event => {
        const date = new Date(event.datetime).toLocaleDateString();
        const venue = event.venue;
        return `**${date}** – ${venue.city}, ${venue.region || venue.country} – ${venue.name}`;
      }).join('\n');

      const tourEmbed = new EmbedBuilder()
        .setTitle('🎸 Geese Tour Dates')
        .setColor(0x1db954)
        .setDescription(tourList)
        .setFooter({ text: 'Data from Bandsintown' });

      await message.channel.send({ embeds: [tourEmbed] });
    } catch (err) {
      console.error('❌ Error fetching tour data:', err);
      await message.channel.send('⚠️ Could not retrieve tour info at this time.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
