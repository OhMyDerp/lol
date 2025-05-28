const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const OWNER_ID = '1168495754894131251';
const tourFile = './tours.json';

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Display upcoming tours
  if (message.content.toLowerCase() === '!geese tour') {
    try {
      const data = fs.readFileSync(tourFile);
      const tours = JSON.parse(data);

      const today = new Date().toISOString().split('T')[0];
      const upcomingTours = tours.filter(t => t.date >= today);

      // Update file to clean out old dates
      fs.writeFileSync(tourFile, JSON.stringify(upcomingTours, null, 2));

      if (!upcomingTours.length) {
        return message.channel.send('📭 No upcoming Geese shows.');
      }

      const tourList = upcomingTours.map((event, i) =>
        `**#${i+1} – ${event.date}** – ${event.city}, ${event.country} – ${event.venue}`
      ).join('\n');

      const embed = new EmbedBuilder()
        .setTitle('🎸 Geese Tour Dates')
        .setColor(0x1db954)
        .setDescription(tourList);

      await message.channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('Error loading tour data:', err);
      message.channel.send('⚠️ Could not load tour info.');
    }
  }

  // Add tour (requires owner approval)
  if (message.content.startsWith('!addtour')) {
    const args = message.content.split('|').map(arg => arg.trim());
    if (args.length !== 4) {
      return message.channel.send(
        '❗ Format: `!addtour YYYY-MM-DD | Venue Name | City | Country`'
      );
    }

    const [date, venue, city, country] = args;
    console.log('Parsed date:', date);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return message.reply('❌ Date must be in `YYYY-MM-DD` format.');
    }

    const preview = `📅 **${date}** – ${city}, ${country} – ${venue}`;
    const confirmMsg = await message.channel.send(
      `Add this tour date?\n${preview}\n\nOnly <@${OWNER_ID}> can approve this.`
    );
    await confirmMsg.react('✅');
    await confirmMsg.react('❌');

    const filter = (reaction, user) =>
      ['✅', '❌'].includes(reaction.emoji.name) && user.id === OWNER_ID;

    const collector = confirmMsg.createReactionCollector({ filter, max: 1, time: 15000 });

    collector.on('collect', reaction => {
      if (reaction.emoji.name === '✅') {
        const tours = fs.existsSync(tourFile) ? JSON.parse(fs.readFileSync(tourFile)) : [];
        tours.push({ date, venue, city, country });
        fs.writeFileSync(tourFile, JSON.stringify(tours, null, 2));
        message.channel.send('✅ Tour date added successfully!');
      } else {
        message.channel.send('❌ Tour date addition cancelled.');
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        message.channel.send('⏱ Timed out. No action taken.');
      }
    });
  }

  // Remove tour (owner only)
  if (message.content.startsWith('!removetour')) {
    if (message.author.id !== OWNER_ID) {
      return message.reply("❌ Only the owner can remove tour dates.");
    }

    const args = message.content.split(' ');
    const index = parseInt(args[1], 10) - 1;

    if (isNaN(index)) {
      return message.reply('⚠️ Please provide a valid tour index to remove. (e.g. `!removetour 2`)');
    }

    const tours = fs.existsSync(tourFile) ? JSON.parse(fs.readFileSync(tourFile)) : [];

    if (index < 0 || index >= tours.length) {
      return message.reply('⚠️ That index is out of range.');
    }

    const removed = tours.splice(index, 1);
    fs.writeFileSync(tourFile, JSON.stringify(tours, null, 2));
    return message.channel.send(`🗑 Removed tour date: **${removed[0].date}** – ${removed[0].venue}`);
  }
});

client.login(process.env.BOT_TOKEN);
