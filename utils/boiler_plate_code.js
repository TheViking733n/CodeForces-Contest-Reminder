const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--unhandled-rejections=strict"
        ]
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

client.on('message', message => {
    console.log(message.from, message.body);
    var bot_reply = parse(message);
    if (bot_reply != "") {
        client.sendMessage(message.from, bot_reply.trim());
    }
});


function parse(message) {
    var body = message.body;
    if (body[0] === '.') {
        // User send a command
        // Get which command
        body = body.toLowerCase();
        body = body.replace(/ +(?= )/g,'');  // Remove double spaces
        body = body.replace(". ", ".");

        let command = body.split(' ')[0].substring(1);
        let args = body.split(' ').slice(1);
        
        // return "Your command:\n\n" + command;
        switch (command) {
            case 'start':
                return start();

            case 'help':
                return help();

            default:
                return "Command not found!";
        }

    } else {
        // User send a message
        return "Your Message:\n\n" + body;
    }
}

function start() {
    return "Reply of start command";
}

function help() {
    return "Reply of help command";
}

