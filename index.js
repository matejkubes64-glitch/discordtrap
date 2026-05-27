const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

// Mini webový server, aby Render nehlásil chybu "Port scan timeout"
const server = http.createServer((req, res) => {
    res.write("Bot bezi!");
    res.end();
});

server.listen(process.env.PORT || 10000, () => {
    console.log(`Webový server běží na portu ${process.env.PORT || 10000}`);
});

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
const BAN_CHANNEL_ID = '1509021617207119922'; 
// !!! VLOŽ SEM SVOU URL ADRESU Z RENDERU (např. https://tvuj-bot.onrender.com) !!!
const RENDER_URL = 'SEM_VLOZ_SVOJU_URL_Z_RENDERU'; 

client.once('ready', () => {
    console.log(`Bot je online jako ${client.user.tag}!`);

    // Self-ping interval: Každých 5 minut (300 000 ms) pošle požadavek sám na sebe, aby Render neusnul
    if (RENDER_URL && !RENDER_URL.includes('https://discordtrap.onrender.com')) {
        setInterval(() => {
            http.get(RENDER_URL, (res) => {
                console.log(`[Keep-Alive] Ping úspěšný. Status: ${res.statusCode}`);
            }).on('error', (err) => {
                console.error('[Keep-Alive] Chyba při pingu na Render:', err.message);
            });
        }, 300000); 
    } else {
        console.warn('[Keep-Alive] Varování: Nevložil jsi platnou RENDER_URL. Bot může po 15 minutách usnout!');
    }
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

// Globální zachycení chyb, aby bot úplně nespadnul (necrashnul), když se na Discord API něco nepovede
process.on('unhandledRejection', (reason, promise) => {
    console.error('Nezachycené odmítnutí slibu (unhandledRejection):', promise, 'důvod:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Nezachycená výjimka (uncaughtException):', error);
});

client.login(BOT_TOKEN);
