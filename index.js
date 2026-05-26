
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// !!! SEM DOPLŇ SVOJE ÚDAJE !!!
const BOT_TOKEN = process.env.BOT_TOKEN; 
const BAN_CHANNEL_ID = '1508951807479513199'; 

client.once('ready', () => {
    console.log(`Bot je online jako ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignoruj zprávy od ostatních botů a zprávy v jiných místnostech
    if (message.author.bot || message.channel.id !== BAN_CHANNEL_ID) return;

    // Pokud zprávu napsal majitel serveru, bot ho zabanovat nemůže (Discord to zakazuje)
    if (message.author.id === message.guild.ownerId) {
        console.log(`Majitel serveru ${message.author.tag} napsal do roomky, ale nemohu ho zabanovat.`);
        return;
    }

    const member = message.member;

    if (member) {
        if (member.bannable) {
            try {
                // Smaže zprávu a zabanuje uživatele
                await member.ban({ deleteMessageSeconds: 86400, reason: 'Napsal zprávu do zakázané roomky.' });
                console.log(`Uživatel ${message.author.tag} byl úspěšně zabanován.`);
            } catch (error) {
                console.error(`Chyba při banování uživatele ${message.author.tag}:`, error);
            }
        } else {
            console.log(`Uživatele ${message.author.tag} nemohu zabanovat. Má vyšší roli než bot?`);
        }
    }
});

client.login(BOT_TOKEN);
