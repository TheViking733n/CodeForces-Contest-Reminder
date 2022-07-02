/*
Version 1.0.0
Released on 26.06.2022
*/ 

const rp = require('request-promise');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');


// Global variables
const contest_url = "https://codeforces.com/api/contest.list?gym=false";
var contest_list = "CodeForces is down⚠️";
var is_client_ready = false;
var upcoming_contest = null;
const relative_server_time = 19800;   // 5.5 hours
const super_admin = "918505077040@c.us";
const config_file = './bot_config.json';
var CONFIG = {             // Default configuration
    "interval": "14400000",
    "remind_before": "46800000",
    "admins": [
        "918505077040@c.us"
    ],
    "groups": [
        "120363041093855277@g.us"
    ]
}
const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));

try {
    console.log("Reading config file...");
    var jsonString = fs.readFileSync(config_file, "utf8");
    CONFIG = JSON.parse(jsonString);
    console.log("Successfully read config file!");
} catch (err) {
    console.log("Error reading config file: " + err);
    update_config();
}

console.log(CONFIG);


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
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
    is_client_ready = true;
});

client.initialize();

client.on('message', message => {
    console.log(message.from, message.author, message.body);
    var bot_reply = parse(message);
    if (bot_reply != "") {
        client.sendMessage(message.from, bot_reply.trim());
    }
});



// To parse message send by user
function parse(message) {
    var body = message.body;
    if (body[0] === '.') {
        // User send a command
        // Get which command
        body = body.toLowerCase();
        body = body.replace(/ +(?= )/g, ''); // Remove double spaces
        body = body.replace(". ", ".");

        let command = body.split(' ')[0].substring(1);
        let args = body.split(' ').slice(1);

        // return "Your command:\n\n" + command;
        switch (command) {
            case 'contest':
                return Contests(message);

            case 'contests':
                return Contests(message);

            case 'help':
                return Help();

            case 'about':
                return About();

            case 'promote':
                return Promote(message, args);

            case 'demote':
                return Demote(message, args);

            case 'enable':
                return Enable_reminder(message);

            case 'disable':
                return Disable_reminder(message);

            case 'interval':
                return Interval(message, args);

            case 'remind_before':
                return Remind_before(message, args);

            case 'reminder':
                return Remind_before(message, args);

            case "config":
                return Bot_config(message);

            case "reset":
                return Reset(message, args);

            default:
                return "Command not found⚠️\n\nUse *.help* to get list of all commands​🤖​";
        }

    } else {
        // User send a message
        // return "Your Message:\n\n" + body;
        return "";
    }
}




// Functions to generate replies for bot commands

function Help() {
    return help_reply.trim();
}


function About() {
    return about_reply.trim();
}


function send_contests_reply(message) {
    client.sendMessage(message.from, contest_list.trim());
}


function Contests(message) {
    get_contests();
    setTimeout(function () { send_contests_reply(message); }, 4000);
    return "";
}


function Promote(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        return "Please specify a 12 digit mobile number (with country code) after command.📱​\nExample:\n*.promote 919876543210*";
    }
    var mobno = args[0].trim();
    if (mobno.length != 12 || isNaN(mobno)) {
        return "Please Enter a valid mobile number⚠️\nExample:\n*.promote 919876543210*";
    }
    var username = mobno + "@c.us";
    if (CONFIG.admins.includes(username)) {
        return "User is already an admin!​🤖​​";
    }
    if (!isGroup) {
        return "This command is only available in groups‼️";
    }
    if (!isAdmin) {
        return "This command is only available for admins‼️";
    }
    CONFIG.admins.push(username);
    update_config();
    return "Success: User *" + mobno + "* promoted to admin✅​";
}


function Demote(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        return "Please specify a 12 digit mobile number (with country code) after command.📱\nExample:\n*.demote 919876543210*";
    }
    var mobno = args[0].trim();
    if (mobno.length != 12 || isNaN(mobno)) {
        return "Please Enter a valid mobile number⚠️\nExample:\n*.demote 919876543210*";
    }
    var username = mobno + "@c.us";
    if (username == super_admin) {
        return "You can't demote a super admin🙃​";
    }
    if (!CONFIG.admins.includes(username)) {
        return "User is not an admin⚠️";
    }
    if (!isGroup) {
        return "This command is only available in groups‼️";
    }
    if (!isAdmin) {
        return "This command is only available for admins‼️";
    }
    CONFIG.admins.splice(CONFIG.admins.indexOf(username), 1);
    update_config();
    return "Success: User *" + mobno + "* demoted from admin🚫​";
}


function Enable_reminder(message) {
    var isGroup = is_group(message);
    // var isAdmin = is_admin(message);
    var isAdmin = true;
    var chatid = message.from;
    if (chatid.endsWith("@c.us")) {
        return "This command is not allowed in DM⚠️\nPlease use this command in a group​🤖​";
    }
    if (CONFIG.groups.includes(chatid)) {
        return "This group is already enabled for reminders​🤖​";
    }
    if (!isGroup) {
        return "This command is only available in groups‼️";
    }
    if (!isAdmin) {
        return "This command is only available for admins‼️";
    }
    CONFIG.groups.push(chatid);
    update_config();
    get_contests();
    setTimeout(send_reminder, 10000);   // Send reminder after 10 seconds so that contest list get updated
    return "CodeForces contest reminder enabled for this group✅";
}


function Disable_reminder(message) {
    var isGroup = is_group(message);
    // var isAdmin = is_admin(message);
    var isAdmin = true;
    var chatid = message.from;
    if (chatid.endsWith("@c.us")) {
        return "This command is not allowed in DM⚠️\nPlease use this command in a group​🤖​";
    }
    if (!CONFIG.groups.includes(chatid)) {
        return "This group is already disabled for reminders​🤖​";
    }
    if (!isGroup) {
        return "This command is only available in groups‼️";
    }
    if (!isAdmin) {
        return "This command is only available for admins‼️";
    }
    CONFIG.groups.splice(CONFIG.groups.indexOf(chatid), 1);
    update_config();
    return "CodeForces contest reminder disabled for this group🚫";
}


function Interval(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        return `Interval between checking for contests: ${parseInt(CONFIG.interval / 60000)} minutes🕛`;
    }
    try {
        var interval_min = args[0];
        var interval = parseInt(interval_min) * 60000;
        if (interval == null || isNaN(interval)) {
            return "Error in setting interval: Please enter a valid interval in minutes⚠️\nExample:\n*.interval 10*";
        }
        if (!isGroup) {
            return "This command is only available in groups‼️";
        }
        if (!isAdmin) {
            return "This command is only available for admins‼️";
        }
        CONFIG.interval = interval;
        update_config();
        return `Interval between checking for contests set to ${parseInt(CONFIG.interval / 60000)} minutes🕛`;
    } catch (err) {
        return "Error in setting interval: Please enter a valid interval in minutes⚠️\nExample:\n*.interval 10*";
    }
}


function Remind_before(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        return `Reminder time before contest: ${parseInt(CONFIG.remind_before / 3600000)} hours⏰`;
    }
    try {
        var remind_before = args[0];
        var remind_before_hours = parseInt(remind_before);
        var remind_before_milliseconds = remind_before_hours * 3600000;
        if (remind_before_milliseconds == null || isNaN(remind_before_milliseconds)) {
            return "Error in setting reminder time: Please enter a valid time in hours⚠️\nExample:\n*.reminder 2*";
        }
        if (!isGroup) {
            return "This command is only available in groups‼️";
        }
        if (!isAdmin) {
            return "This command is only available for admins‼️";
        }
        CONFIG.remind_before = remind_before_milliseconds;
        update_config();
        return `Reminder time before contest set to ${parseInt(CONFIG.remind_before / 3600000)} hours⏰`;
    } catch (err) {
        return "Error in setting reminder time: Please enter a valid time in hours⚠️\nExample:\n*.reminder 2*";
    }
}


function Bot_config(message) {
    return "```" + JSON.stringify(CONFIG, null, 2) + "```";
}


function Reset(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        return "Are you sure you want to reset❓\nAll the configurations will be reset to default⚠️\n\nUsage: *.reset CONFIRM*";
    }
    if (!isAdmin) {
        return "This command is only available for admins‼️";
    }
    if (args[0].toUpperCase() == "CONFIRM") {
        CONFIG = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        update_config();
        return "Success: Configurations reset to default✅";
    }
    return "Are you sure you want to reset❓\nAll the configurations will be reset to default⚠️\n\nUsage: *.reset CONFIRM*";
}






function is_group(message) {
    return (typeof (message.author) != "undefined");
}

function is_admin(message) {
    var senderid = is_group(message) ? message.author : message.from;
    if (senderid == "") {
        return false;
    }
    if (senderid == super_admin) {
        return true;
    }
    if (CONFIG.admins.includes(senderid)) {
        return true;
    }
    return false;
}



function get_contests() {
    rp(contest_url)
        .then(function (body) {
            // console.log(body);
            let json = null;
            try {
                json = JSON.parse(body).result;
                // console.log(json);
                let contests = [];
                for (let i = 0; i < json.length; i++) {
                    if (json[i].phase == "BEFORE") {
                        contests.push(json[i]);
                    }
                }
                contests.reverse();
                upcoming_contest = contests[0];
                let msg = "```Upcomming CF Contests🏁​\n";
                msg += "=======================```\n\n"
                for (let i = 0; i < contests.length; i++) {
                    // console.log(contests[i].name);
                    var time = convertTimestamp(contests[i].startTimeSeconds);
                    var timeLeft = parseTimeLeft(-parseInt(contests[i].relativeTimeSeconds));
                    msg += "*" + contests[i].name + "*🌐\n" + time + "​📅​\n" + timeLeft + "⏰​\n\n";
                }
                // console.log(msg);
                contest_list = msg;
                return msg;
            }
            catch (e) {
                console.log("CodeForces is down!");
                return "CodeForces is down⚠️";
            }
        }
        )
        .catch(function (err) {
            console.log(err);
            return "CodeForces is down⚠️";
        });
}


function convertTimestamp(timestamp) {
    timestamp += relative_server_time;
    var d = new Date(timestamp * 1000),	// Convert the passed timestamp to milliseconds
        yyyy = d.getFullYear(),
        mm = ('0' + (d.getMonth() + 1)).slice(-2),	// Months are zero based. Add leading 0.
        dd = ('0' + d.getDate()).slice(-2),			// Add leading 0.
        hh = d.getHours(),
        h = hh,
        min = ('0' + d.getMinutes()).slice(-2),		// Add leading 0.
        ampm = 'AM',
        time;

    if (hh > 12) {
        h = hh - 12;
        ampm = 'PM';
    } else if (hh === 12) {
        h = 12;
        ampm = 'PM';
    } else if (hh === 0) {
        h = 12;
    }

    // ie: 18-02-2013, 8:35 AM	
    time = dd + '-' + mm + '-' + yyyy + ', ' + h + ':' + min + ' ' + ampm;

    return time;
}


function parseTimeLeft(seconds) {
    var days = Math.floor(seconds / 86400);
    var hours = Math.floor((seconds % 86400) / 3600);
    var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    var seconds = ((seconds % 86400) % 3600) % 60;
    var timeLeft = "";
    if (days > 0) {
        timeLeft += days + " days, ";
    }
    if (hours > 0) {
        timeLeft += hours + " hours, ";
    }
    if (minutes > 0) {
        timeLeft += minutes + " minutes";
    }
    if (timeLeft == "") {
        timeLeft += seconds + " sec";
    }
    timeLeft = timeLeft.trim();
    timeLeft = "Time Left: _" + timeLeft + "_";
    return timeLeft;
}



function update_config() {
    try {
        // console.log("Writing config file...");
        fs.writeFileSync(config_file, JSON.stringify(CONFIG, null, 4));
        // console.log("Successfully wrote config file!");
    } catch (err) {
        console.log("Error writing config file: " + err);
    }
}


function send_reminder() {
    if (upcoming_contest != null && (-parseInt(upcoming_contest.relativeTimeSeconds))*1000 <= CONFIG.remind_before) {
        var timeLeft = parseTimeLeft(-parseInt(upcoming_contest.relativeTimeSeconds));
        var time = convertTimestamp(upcoming_contest.startTimeSeconds);
        var reply = "```Reminder for CF Contest🏁:```";
        reply += `\n*${upcoming_contest.name}*🌐 on\n${time}​📅​\n\n${timeLeft}⏰​`;
        for (let i = 0; i < CONFIG.groups.length; i++) {
            client.sendMessage(CONFIG.groups[i], reply.trim());
        }
    }
}


function check() {
    if (is_client_ready) {
        get_contests()
        setTimeout(send_reminder, 10000);   // Send reminder after 10 seconds so that contest list get updated
        // console.log("Running...");
        // console.log(upcoming_contest);
    } else {
        console.log("Client Not ready...");
    }

    setTimeout(check, CONFIG.interval);
}

setTimeout(check, 60000);   // Call check for the first time after 1 minute



var help_reply = `
🎉Welcome to the help section of this bot🤖

*This bot🤖 will send reminders for upcoming CF contests*🏁

*How to use this bot*🤖❓
_Add this bot to your whatsapp groups💬 and then send_ *.enable* _command to enable CF Contests reminder for your group._

*List of available commands:*

*.help*
_Displays this help message_

*.contest*
_Sends a list of upcomming CF contests_

*.about*
_About message_

*.promote 91XXXXXYYYYY*
_Adds a user to admin list of bot commands_

*.demote 91XXXXXYYYYY*
_Removes a user from admin list of bot commands_

*.enable*
_Enables CodeForces Contests reminder for the groups_

*.disable*
_Disables CodeForces Contests reminder for the groups_

*.interval MINUTES*
_Sets the time interval in minutes between two consecutive reminders_

*.reminder HOURS*
_Sets the time in hours before which the bot will start sending reminders_

*.reset CONFIRM*
_Resets the bot to default configurations. All admins will be removed!_
`;


var about_reply = `
Programmed by:
*The Viking*😎
https://www.github.com/TheViking733n

🗓Date programmed:
*26 June, 2022*

Credits:
*whatsapp-web.js*
`;