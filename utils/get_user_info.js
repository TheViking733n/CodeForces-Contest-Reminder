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
    var msg = `Author: ${message.author}\n`;
    msg += `From: ${message.from}\n`;
    msg += `Msg ID: ${message.id}\n`;
    client.sendMessage(message.from, msg);
});



function parse(message, userid) {
    if (message[0] === '.') {
        // User send a command
        // Get which command
        message = message.toLowerCase();
        message = message.replace(/ +(?= )/g,'');  // Remove double spaces
        message = message.replace(". ", ".");

        let command = message.split(' ')[0].substring(1);
        let args = message.split(' ').slice(1);
        
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
        var msg = `Author: ${message.author}\n`;
        msg += `From: ${message.from}\n`;
        msg += `Msg ID: ${message.id}\n`;
        return msg;
    }
}

function start() {
    return "Reply of start command";
}

function help() {
    return "Reply of help command";
}

