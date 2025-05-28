
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const OWNER_ID = '1168495754894131251';

function loadTours(filename) {
    if (!fs.existsSync(filename)) return [];
    const raw = fs.readFileSync(filename);
    return JSON.parse(raw).filter(t => new Date(t.date) >= new Date());
}

function saveTours(filename, tours) {
    fs.writeFileSync(filename, JSON.stringify(tours, null, 2));
}

function createEmbed(title, tours) {
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00AE86);

    if (tours.length === 0) {
        embed.setDescription("No upcoming shows.");
    } else {
        const desc = tours.map(t => `📅 **${t.date}** — ${t.venue}, ${t.city}, ${t.country}`).join('\n');
        embed.setDescription(desc);
    }

    return embed;
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.split('|').map(arg => arg.trim());
    const [cmd, ...rest] = args;

    if (cmd.startsWith('!geese tour')) {
        const tours = loadTours('./geese_tours.json');
        const embed = createEmbed('🎸 Geese — Upcoming Tour Dates', tours);
        return message.channel.send({ embeds: [embed] });
    }

    if (cmd.startsWith('!cameron tour')) {
        const tours = loadTours('./cameron_tours.json');
        const embed = createEmbed('🎤 Cameron Winter — Upcoming Solo Dates', tours);
        return message.channel.send({ embeds: [embed] });
    }

    if (cmd.startsWith('!addgeesetour') || cmd.startsWith('!addcamerontour')) {
        if (message.author.id !== OWNER_ID) return message.channel.send('❌ You are not authorized to add tour dates.');
        if (args.length < 4) return message.channel.send('❌ Format: !addgeesetour YYYY-MM-DD | Venue | City | Country');

        const date = args[0].split(' ')[1];
        const venue = args[1], city = args[2], country = args[3];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return message.channel.send('❌ Date must be in `YYYY-MM-DD` format.');

        const filename = cmd.includes('cameron') ? './cameron_tours.json' : './geese_tours.json';
        const tours = loadTours(filename);
        tours.push({ date, venue, city, country });
        saveTours(filename, tours);
        return message.channel.send(`✅ Tour added: ${venue}, ${city}, ${country} on ${date}`);
    }

    if (cmd.startsWith('!removegeesetour') || cmd.startsWith('!removecamerontour')) {
        if (message.author.id !== OWNER_ID) return message.channel.send('❌ You are not authorized to remove tour dates.');
        const date = cmd.split(' ')[1];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return message.channel.send('❌ Format: !removegeesetour YYYY-MM-DD');

        const filename = cmd.includes('cameron') ? './cameron_tours.json' : './geese_tours.json';
        let tours = loadTours(filename);
        const newTours = tours.filter(t => t.date !== date);
        saveTours(filename, newTours);
        return message.channel.send(`✅ Removed tour on ${date}`);
    }
});

client.login(process.env.TOKEN);
