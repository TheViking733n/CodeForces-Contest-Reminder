/*
Version 1.5.0
Released on 02.07.2022

New Commands and Features:
    .promote @user
    .demote @user
    .join InviteLink
    .broadcast Message_to_send

*/

const rp = require('request-promise');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, List, Buttons, Contact, LocalAuth } = require('whatsapp-web.js');


// Global variables
const contest_url = "https://codeforces.com/api/contest.list?gym=false";
var contest_list = "CodeForces is down⚠️";
var is_client_ready = false;
var upcoming_contest = null;
const relative_server_time = 19800;   // 5.5 hours
const super_admin = "918505077040@c.us";
const config_file = './bot_config.json';
var CONFIG = {             // Default configuration
    "admins": [
        "918505077040@c.us"
    ],
    "groups": {}
}
// const DEFAULT_CONFIG = JSON.parse(JSON.stringify(CONFIG));
const DEFAULT_CONFIG = {
    "enabled": false,
    "interval": 21600000,
    "remind_before": 86400000,
    "last_reminded_at": 0,
    "handles": []
};

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

client.on('message', async message => {
    console.log(message.from, message.author, message.body);
    await parse(message);
    // if (bot_reply != "") {
    //     client.sendMessage(message.from, bot_reply.trim());
    // }
});

if (!Date.now) {
    Date.now = function() { return new Date().getTime(); }
}
function CurTimestamp() {
    return new Date().valueOf();
}

// To parse message send by user
async function parse(message) {
    var body = message.body;
    if (body[0] === '.') {
        // User send a command
        // Get which command

        // Send Hello World if it is first command
        await check_if_first_msg(message);

        body = body.replace(/ +(?= )/g, ''); // Remove double spaces
        body = body.replace(". ", ".");
        
        // Special case for broadcast command
        if (body.startsWith(".broadcast")) {
            Broadcast(message, body.slice(".broadcast".length));
            return;
        }
        
        let command = body.split(' ')[0].substring(1);
        let argline = body.slice(command.length + 1);
        let args = body.split(' ').slice(1);
        command.toLowerCase();

        // return "Your command:\n\n" + command;
        switch (command) {
            case 'contest':
                Contests(message);
                break;

            case 'contests':
                Contests(message);
                break;

            case 'help':
                Help(message);
                break;

            case 'about':
                About(message);
                break;

            case 'promote':
                Promote(message, args);
                break;

            case 'demote':
                Demote(message, args);
                break;

            case 'enable':
                Enable_reminder(message);
                break;

            case 'disable':
                Disable_reminder(message);
                break;

            case 'interval':
                Interval(message, args);
                break;

            case 'remind_before':
                Remind_before(message, args);
                break;

            case 'reminder':
                Remind_before(message, args);
                break;

            case "config":
                Bot_config(message);
                break;

            case "reset":
                Reset(message, args);
                break;

            case "test":
                Test(message, args);
                break;
            
            case "t":
                check_if_first_msg(message);
                break;
            
            case "join":
                Join(message, args);
                break;
            
            case "broadcast":
                Broadcast(message, argline);
                break;

            default:
                client.sendMessage(message.from, "Command not found⚠️\n\nUse *.help* to get list of all commands​🤖​");
        }

    }
    // else {
    //     // User send a message
    //     // return "Your Message:\n\n" + body;
    //     return "";
    // }
}




// Functions to generate replies for bot commands

function Help(message) {
    client.sendMessage(message.from, help_reply.trim());
}


function About(message) {
    client.sendMessage(message.from, about_reply.trim());
}


async function Contests(message) {
    await get_contests();
    client.sendMessage(message.from, contest_list.trim());
}


async function Promote(message, args) {
    // Only bot admins can promote others to bot admins
    // Group admins can't promote others to bot admins
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        client.sendMessage(message.from, "Usage:\n*.promote @user*");
        return;
    }
    var mobno = args[0].trim();
    mobno = mobno.replace("@", "");
    if (mobno.length != 12 || isNaN(mobno)) {
        client.sendMessage(message.from, "Please Enter a valid mobile number or @tag⚠️\nExample:\n*.promote @user*");
        return;
    }
    var username = mobno + "@c.us";
    if (CONFIG.admins.includes(username)) {
        client.sendMessage(message.from, "User is already an bot admin!​🤖​​");
        return;
    }
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    if (!isAdmin) {
        client.sendMessage(message.from, "This command is only available for bot admins‼️");
        return;
    }
    try {
        var contact = await client.getContactById(username);
        client.sendMessage(message.from, `Success: User @${contact.number} promoted to admin✅`, {mentions: [contact]});
        CONFIG.admins.push(username);
        update_config();
        return;
    }
    catch (err) {
        client.sendMessage(message.from, "Error: User not found⚠️");
        return;
    }
}


async function Demote(message, args) {
    // Only bot admins can demote others from bot admins
    // Group admins can't demote others from bot admins
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (args.length == 0) {
        client.sendMessage(message.from, "Usage:\n*.demote @user*");
        return;
    }
    var mobno = args[0].trim();
    mobno = mobno.replace("@", "");
    if (mobno.length != 12 || isNaN(mobno)) {
        client.sendMessage(message.from, "Please Enter a valid mobile number or @tag⚠️\nExample:\n*.demote @user*");
        return;
    }
    var username = mobno + "@c.us";
    if (username == super_admin) {
        client.sendMessage(message.from, "You can't demote a super admin🙃​");
        return;
    }
    if (!CONFIG.admins.includes(username)) {
        client.sendMessage(message.from, "User is not an bot admin⚠️");
        return;
    }
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    if (!isAdmin) {
        client.sendMessage(message.from, "This command is only available for bot admins‼️");
        return;
    }
    try {
        var contact = await client.getContactById(username);
        client.sendMessage(message.from, `Success: User @${contact.number} demoted from bot admin🚫`, {mentions: [contact]});
        CONFIG.admins.splice(CONFIG.admins.indexOf(username), 1);
        update_config();
        return;
    }
    catch (err) {
        client.sendMessage(message.from, "Error: User not found⚠️");
        return;
    }
}



async function Enable_reminder(message) {
    var isGroup = is_group(message);
    // var isAdmin = is_admin(message);
    var isAdmin = true;
    var groupid = message.from;
    if (!isGroup) {
        client.sendMessage(message.from, "This command is not allowed in DM⚠️\nPlease use this command in a group​🤖​");
        return;
    }

    await check_if_first_msg(message);

    if (CONFIG.groups[groupid].enabled) {
        client.sendMessage(message.from, "This group is already enabled for reminders​🤖​");
        return;
    }
    if (!isAdmin) {
        client.sendMessage(message.from, "This command is only available for bot admins‼️");
        return;
    }
    CONFIG.groups[groupid].enabled = true;
    CONFIG.groups[groupid].last_reminded_at = 0;
    update_config();
    client.sendMessage(message.from, `
CodeForces Contests reminders enabled for this group✅

Current reminders interval is *${parseInt(CONFIG.groups[groupid].interval / 60000)} minutes*🕛​
And will be sent *${parseInt(CONFIG.groups[groupid].remind_before / 3600000)} hours*⏰ before the contest.
`.trim());

}


async function Disable_reminder(message) {
    var isGroup = is_group(message);
    // var isAdmin = is_admin(message);
    var isAdmin = true;
    var groupid = message.from;
    if (!isGroup) {
        client.sendMessage(message.from, "This command is not allowed in DM⚠️\nPlease use this command in a group​🤖​");
        return;
    }

    await check_if_first_msg(message);

    if (!CONFIG.groups[groupid].enabled) {
        client.sendMessage(message.from, "This group is already disabled for reminders​🤖​");
        return;
    }
    if (!isAdmin) {
        client.sendMessage(message.from, "This command is only available for bot admins‼️");
        return;
    }
    CONFIG.groups[groupid].enabled = false;
    update_config();
    client.sendMessage(message.from, "CodeForces contest reminder disabled for this group🚫");
}



async function Interval(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    var isGrpAdmin = false;
    if (isGroup) {
        isGrpAdmin = await is_group_admin(message);
    }
    if (args.length == 0) {
        client.sendMessage(message.from, `Interval between checking for contests: *${parseInt(CONFIG.groups[groupid].interval / 60000)} minutes*🕛`);
        return;
    }
    try {
        var interval_min = args[0];
        var interval = parseInt(interval_min) * 60000;
        if (interval == null || isNaN(interval)) {
            client.sendMessage(message.from, "Error in setting interval: Please enter a valid interval in minutes⚠️\nExample:\n*.interval 10*");
            return;
        }
        if (!(isAdmin || isGrpAdmin)) {
            client.sendMessage(message.from, "This command is only available for admins‼️");
            return;
        }
        CONFIG.groups[groupid].interval = interval;
        update_config();
        client.sendMessage(message.from, `Interval between checking for contests set to *${parseInt(CONFIG.groups[groupid].interval / 60000)} minutes*🕛`);
        return;
    } catch (err) {
        client.sendMessage(message.from, "Error in setting interval: Please enter a valid interval in minutes⚠️\nExample:\n*.interval 10*");
        return;
    }
}


async function Remind_before(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    var isGrpAdmin = false;
    if (isGroup) {
        isGrpAdmin = await is_group_admin(message);
    }
    if (args.length == 0) {
        client.sendMessage(message.from, `Reminder time before contest: *${parseInt(CONFIG.groups[groupid].remind_before / 3600000)} hours*⏰`);
        return;
    }
    try {
        var remind_before = args[0];
        var remind_before_hours = parseInt(remind_before);
        var remind_before_milliseconds = remind_before_hours * 3600000;
        if (remind_before_milliseconds == null || isNaN(remind_before_milliseconds)) {
            client.sendMessage(message.from, "Error in setting reminder time: Please enter a valid time in hours⚠️\nExample:\n*.reminder 2*");
            return;
        }
        if (!(isAdmin || isGrpAdmin)) {
            client.sendMessage(message.from, "This command is only available for admins‼️");
            return;
        }
        CONFIG.groups[groupid].remind_before = remind_before_milliseconds;
        update_config();
        client.sendMessage(message.from, `Reminder time before contest set to *${parseInt(CONFIG.groups[groupid].remind_before / 3600000)} hours*⏰`);
        return;
    } catch (err) {
        client.sendMessage(message.from, "Error in setting reminder time: Please enter a valid time in hours⚠️\nExample:\n*.reminder 2*");
        return;
    }
}


function Bot_config(message) {
    client.sendMessage(message.from, "```" + JSON.stringify(CONFIG, null, 2) + "```");
}


function Reset(message, args) {
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    if (args.length == 0) {
        client.sendMessage(message.from, "Are you sure you want to reset❓\nAll the configurations for this group will be reset to default⚠️\n\nUsage: *.reset CONFIRM*");
        return;
    }
    if (!isAdmin) {
        client.sendMessage(message.from, "This command is only available for admins‼️");
        return;
    }
    if (args[0].toUpperCase() == "CONFIRM") {
        CONFIG.groups[groupid] = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        update_config();
        client.sendMessage(message.from, "Success: Configurations reset to default✅");
        return;
    }
    client.sendMessage(message.from, "Are you sure you want to reset❓\nAll the configurations for this group will be reset to default⚠️\n\nUsage: *.reset CONFIRM*");
    return;
}

async function Test(message, args) {
    // let button = new Buttons('Button body',[{body:'bt1'},{body:'bt2'},{body:'bt3'}],'title','footer');
    // client.sendMessage(message.from, button);
    
    // let sections = [{title:'sectionTitle',rows:[{title:'ListItem1', description: 'desc'},{title:'ListItem2'}]}];
    // let list = new List('List body','btnText',sections,'Title','footer');
    // client.sendMessage(message.from, list);
    // return
    
    
    var isGroup = is_group(message);
    var isAdmin = is_admin(message);
    var isGrpAdmin = false;
    if (isGroup) {
        isGrpAdmin = await is_group_admin(message);
    }
    client.sendMessage(message.from, `
isGroup: ${isGroup}
isAdmin: ${isAdmin}
isGrpAdmin: ${isGrpAdmin}
    `.trim());
    
}

async function T(message, args) {
    return;
    // contact = new Contact('+919012345678');
    // client.sendMessage(message.from, `Success: User @${contact.number} promoted to bot admin✅​`, {mentions: [contact]});
}


async function Join(message, args) {
    if (args.length == 0) {
        client.sendMessage(message.from, "Usage: *.join InviteCode*");
        return;
    }
    var inviteCode = args[0];
    inviteCode = inviteCode.replace('https://chat.whatsapp.com/', '');
    console.log(inviteCode);
    try {
        await client.acceptInvite(inviteCode);
        message.reply('Success: Joined the group✅');
    } catch (e) {
        message.reply('Error: Invalid invite code❌');
    }
}


function Broadcast(message, argline) {
    var isAdmin = is_admin(message);
    if (!isAdmin) {
        return "This command is only available for bot admins‼️";
    }
    argline = argline.trim();
    if (argline.length == 0) {
        return "Usage: *.broadcast Message*";
    }
    var message_to_send = argline;
    var groups = Object.keys(CONFIG.groups);
    for (var i = 0; i < groups.length; i++) {
        var groupid = groups[i];
        client.sendMessage(groupid, message_to_send);
    }
    client.sendMessage(message.from, "Success: Message sent to all group members✅")
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

async function is_group_admin(message) {
    var chat = await message.getChat();
    if (chat.isGroup) {
        const authorId = message.author;
        for (let participant of chat.participants) {
            if (participant.id._serialized === authorId) {
                return participant.isAdmin;
            }
        }
    }
    return false;
}



async function check_if_first_msg(message) {
    var chat = await message.getChat();
    if (!chat.isGroup) {
        return;
    }
    var groupid = message.from;
    if (groupid in CONFIG.groups) {
        return;
    }
    CONFIG.groups[groupid] = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    update_config();
    await client.sendMessage(message.from, `Hello World!`);
}





async function get_contests() {
    await rp(contest_url)
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
                contest_list = "CodeForces is down⚠️";
                return "CodeForces is down⚠️";
            }
        }
        )
        .catch(function (err) {
            console.log(err);
            contest_list = "CodeForces is down⚠️";
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


async function send_reminder() {
    // This function is called every minute and it check for groups where it has to send reminder
    // console.log(`Reminder function called`);
    if (!is_client_ready) {
        console.log("Client Not ready...");
        setTimeout(send_reminder, 5000);
        return;
    }
    var groups = Object.keys(CONFIG.groups);
    // This for loop will check whether there is atleast one group where we have to send reminder, if yes then it updates contest list
    for (var i = 0; i < groups.length; i++) {
        var groupid = groups[i];
        if (upcoming_contest == null || (CONFIG.groups[groupid].enabled && upcoming_contest != null && (-parseInt(upcoming_contest.relativeTimeSeconds)) * 1000 <= CONFIG.groups[groupid].remind_before  && ((new Date()) - CONFIG.groups[groupid].last_reminded_at) >= CONFIG.groups[groupid].interval)) {
            await get_contests();
            break;
        }
    }
    
    var f = false;
    for (var i = 0; i < groups.length; i++) {
        var groupid = groups[i];
        if (CONFIG.groups[groupid].enabled && upcoming_contest != null && (-parseInt(upcoming_contest.relativeTimeSeconds)) * 1000 <= CONFIG.groups[groupid].remind_before  && ((new Date()) - CONFIG.groups[groupid].last_reminded_at) >= CONFIG.groups[groupid].interval) {
            var timeLeft = parseTimeLeft(-parseInt(upcoming_contest.relativeTimeSeconds));
            var time = convertTimestamp(upcoming_contest.startTimeSeconds);
            var reply = "```Reminder for CF Contest🏁:```";
            reply += `\n*${upcoming_contest.name}*🌐 on\n${time}​📅​\n\n${timeLeft}⏰​`;
            client.sendMessage(groupid, reply.trim());
            CONFIG.groups[groupid].last_reminded_at = CurTimestamp();
            f = true;
        }
    }
    if (f) {
        update_config();
    }
    setTimeout(send_reminder, 5000);
}


// function check() {
//     if (!is_client_ready) {
//         // get_contests();
//         // setTimeout(send_reminder, 10000);   // Send reminder after 10 seconds so that contest list get updated
//         // console.log("Running...");
//         // console.log(upcoming_contest);
//     // } else {
//         console.log("Client Not ready...");
//         setTimeout(check, 1000);
//         return;
//     }
    
// }

// setTimeout(check, 60000);   // Call check for the first time after 1 minute
// check();

send_reminder();

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

*.enable*
_Enables CodeForces Contests reminder for the groups_

*.disable*
_Disables CodeForces Contests reminder for the groups_

*.interval MINUTES*
_Sets the time interval in minutes between two consecutive reminders (frequency of reminders)_

*.reminder HOURS*
_Sets the time in hours before which the bot will start sending reminders_

*.promote @user*
_Adds a user to bot admin list of bot commands_

*.demote @user*
_Removes a user from bot admin list of bot commands_

*.join InviteLink*
_Joins the group using the invite link_

*.broadcast Message_to_send*
_Sends a message to all the groups in which bot is added_

*.reset CONFIRM*
_Resets the bot to default configurations for that group. By default, bot is disabled for a group!_
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