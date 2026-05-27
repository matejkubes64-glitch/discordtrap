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

// !!! Tady jsou tvé správné údaje !!!
const BOT_TOKEN = process.env.BOT_TOKEN; 
const BAN_CHANNEL_ID = '1509021617207119922'; // Zakázaná místnost (trap)
const LOG_CHANNEL_ID = '1471724200975794287'; // Nová admin místnost pro logy
const RENDER_URL = 'https://discordtrap.onrender.com'; // Tvoje URL z Renderu

client.once('ready', () => {
    console.log(`Bot je online jako ${client.user.tag}!`);

    // Self-ping interval pro udržení naživu (každých 5 minut)
    if (RENDER_URL) {
        setInterval(() => {
            http.get(RENDER_URL, (res) => {
                console.log(`[Keep-Alive] Ping úspěšný. Status: ${res.statusCode}`);
            }).on('error', (err) => {
                console.error('[Keep-Alive] Chyba při pingu na Render:', err.message);
            });
        }, 300000); 
    }
});

client.on('messageCreate', async (message) => {
    // Ignoruj zprávy od ostatních botů a zprávy v jiných místnostech
    if (message.author.bot || message.channel.id !== BAN_CHANNEL_ID) return;

    // Pokud zprávu napsal majitel serveru, bot ho zabanovat nemůže
    if (message.author.id === message.guild.ownerId) {
        console.log(`Majitel serveru ${message.author.tag} napsal do roomky, ale nemohu ho zabanovat.`);
        return;
    }

    const member = message.member;

    if (member) {
        if (member.bannable) {
            try {
                // 1. Uložíme si text zprávy, info o autorovi a název místnosti
                const napsanaZprava = message.content || "*(Žádný text, pouze příloha)*";
                const uzivatelJmeno = message.author.tag;
                const uzivatelId = message.author.id;
                const nazevMistnosti = message.channel.name;

                // 2. Vytáhneme z originální zprávy všechny fotky/přílohy
                const prilohy = [];
                if (message.attachments.size > 0) {
                    message.attachments.forEach(attachment => {
                        prilohy.push(attachment.url);
                    });
                }

                // 3. Bot uživatele zabanuje a smaže jeho zprávy za posledních 24 hodin
                await member.ban({ deleteMessageSeconds: 86400, reason: 'Napsal zprávu/poslal fotku do zakázané roomky.' });
                console.log(`Uživatel ${uzivatelJmeno} byl úspěšně zabanován.`);

                // 4. Najdeme novou logovací roomku podle ID a pošleme tam důkaz
                const logChannel = await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);

                if (logChannel) {
                    await logChannel.send({
                        content: `🔨 **Uživatel zabanován:** ${uzivatelJmeno} (ID: ${uzivatelId})\n🔒 **Místnost:** #${nazevMistnosti}\n📝 **Napsal zprávu:** ${napsanaZprava}`,
                        files: prilohy // Sem se automaticky přiloží fotky, pokud nějaké poslal
                    });
                } else {
                    console.error(`Nepodařilo se najít logovací místnost s ID ${LOG_CHANNEL_ID}. Má k ní bot přístup?`);
                }

            } catch (error) {
                console.error(`Chyba při banování uživatele ${message.author.tag}:`, error);
            }
        } else {
            console.log(`Uživatele ${message.author.tag} nemohu zabanovat. Má vyšší roli než bot?`);
        }
    }
});

// Globální zachycení chyb, aby bot nepadal při chvilkovém výpadku Discord API
process.on('unhandledRejection', (reason, promise) => {
    console.error('Nezachycené odmítnutí slibu (unhandledRejection):', promise, 'důvod:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Nezachycená výjimka (uncaughtException):', error);
});

client.login(BOT_TOKEN);
