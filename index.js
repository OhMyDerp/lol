require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const STAR_EMOJI = '⭐';
const STARBOARD_CHANNEL_NAME = 'starboard';

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching reaction:', error);
      return;
    }
  }

  if (reaction.emoji.name === STAR_EMOJI && reaction.count >= 3) {
    const starboardChannel = reaction.message.guild.channels.cache.find(
      (ch) => ch.name === STARBOARD_CHANNEL_NAME
    );

    if (!starboardChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xfcdc58)
      .setAuthor({ name: reaction.message.author.tag })
      .setDescription(reaction.message.content || '(no text)')
      .setTimestamp(reaction.message.createdAt)
      .setFooter({ text: '✨ Starred by the Geese fandom' });

    if (reaction.message.attachments.size > 0) {
      embed.setImage(reaction.message.attachments.first().url);
    }

    starboardChannel.send({ embeds: [embed] });
  }
});

client.login(process.env.DISCORD_TOKEN);
