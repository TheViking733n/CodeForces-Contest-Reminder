/*
Version 2.0.0
Released on 09.07.2022

New Commands and Features:
    .adduser handle1 handle2 ...
    .deleteuser handle1 handle2 ...
    .listusers
    .performance CONTEST_ID
    .ratings

*/

const rp = require('request-promise');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fetch = require('node-fetch');
const { Client, List, Buttons, Contact, LocalAuth } = require('whatsapp-web.js');
// const { json } = require('express/lib/response');


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

const ratings_file = "./cf_ratings.json";
var RATINGS = {"theviking733n": 1561};
try {
    console.log("Reading ratings file...");
    var jsonString = fs.readFileSync(ratings_file, "utf8");
    RATINGS = JSON.parse(jsonString);
    console.log("Successfully read ratings file!");
} catch (err) {
    console.log("Error reading ratings file: " + err);
    update_ratings();
}



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
        if (body.startsWith(". ")) {
            body = body.replace(". ", ".");
        }
        
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
            case 'frequency':
                Interval(message, args);
                break;

            case 'remind_before':
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
                        
            case "join":
                Join(message, args);
                break;
            
            case "broadcast":
                Broadcast(message, argline);
                break;
            
            case "adduser":
            case "addusers":
            case "add":
                Adduser(message, argline.toLowerCase());
                break;
            
            case "deleteuser":
            case "deleteusers":
            case "delete":
            case "removeuser":
            case "removeusers":
            case "remove":
                Deleteuser(message, argline.toLowerCase());
                break;
            
            case "listusers":
            case "list":
                Listusers(message);
                break;
            
            case "performance":
            case "perf":
                CFPerformance(message, args);
                break;
            
            case "ratings":
            case "rating":
                CommandRatings(message);
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
    var isSuperAdmin = message.from == super_admin || message.author == super_admin;
    if (!isSuperAdmin) {
        return;
    }
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
        client.sendMessage(message.from, "Are you sure you want to reset❓\nAll the configurations for this group will be reset to default⚠️\n\nUsage:\n*.reset CONFIRM*");
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
    client.sendMessage(message.from, "Are you sure you want to reset❓\nAll the configurations for this group will be reset to default⚠️\n\nUsage:\n*.reset CONFIRM*");
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
        client.sendMessage(message.from, "Usage:\n*.join InviteCode*");
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
        return "Usage:\n*.broadcast Message*";
    }
    var message_to_send = argline;
    var groups = Object.keys(CONFIG.groups);
    for (var i = 0; i < groups.length; i++) {
        var groupid = groups[i];
        client.sendMessage(groupid, message_to_send);
    }
    client.sendMessage(message.from, "Success: Message sent to all group members✅")
}


async function Adduser(message, argline) {
    var isGroup = is_group(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    argline = argline.replace(/\n/g, " ");
    var handles = argline.split(" ");
    // console.log(handles);
    if (handles.length == 0) {
        client.sendMessage(message.from, "Usage:\n*.adduser Handle1 Handle2 ...*");
        return;
    }
    var reply = "";
    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i].trim();
        if (handle.length == 0) {
            continue;
        }
        var handle_exists = false;
        try {
            handle_exists = await user_exists(handle);
        } catch (e) {
            console.log(e);
            client.sendMessage(message.from, `Error: CodeForces is down!`);
            return;
        }
        if (!handle_exists) {
            reply += `*${handle}* does not exist❌\n`;
            continue;
        }
        if (CONFIG.groups[groupid].handles.includes(handle)) {
            reply += `*${handle}* already exists🤖\n`;
            continue;
        }
        CONFIG.groups[groupid].handles.push(handle);
        reply += `*${handle}* added✅\n`;
    }
    update_config();
    client.sendMessage(message.from, reply.trim());
}


async function Deleteuser(message, argline) {
    var isGroup = is_group(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    argline = argline.replace(/\n/g, " ");
    var handles = argline.split(" ");
    // console.log(handles);
    if (handles.length == 0) {
        client.sendMessage(message.from, "Usage:\n*.deleteuser Handle1 Handle2 ...*");
        return;
    }
    var reply = "";
    if (handles.length == 0) {
        return "Usage:\n*.deleteuser Handle1 Handle2 ...*";
    }
    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i].trim();
        if (handle.length == 0) {
            continue;
        }
        if (!CONFIG.groups[groupid].handles.includes(handle)) {
            reply += `*${handle}* doesn't exist in the list❌\n`;
            continue;
        }
        CONFIG.groups[groupid].handles.splice(CONFIG.groups[groupid].handles.indexOf(handle), 1);
        reply += `*${handle}* deleted✅\n`;
    }
    update_config();
    client.sendMessage(message.from, reply.trim());
}


async function Listusers(message) {
    var isGroup = is_group(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    var handles = CONFIG.groups[groupid].handles;
    if (handles.length == 0) {
        client.sendMessage(message.from, "No users in the list. Please add users using .adduser command.\n\nUsage:\n*.adduser Handle1 Handle2 ...*");
        return;
    }
    var reply = "*List of handles added in the group:*\n```";
    for (var i = 0; i < handles.length; i++) {
        var sno = `${i + 1}.`;
        reply += `${left_align(sno,4)} ${handles[i]}\n`;
    }
    reply += "```";
    client.sendMessage(message.from, reply);
}


async function CFPerformance(message, args) {
    var isGroup = is_group(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    if (args.length == 0) {
        client.sendMessage(message.from, "Usage:\n*.performance CONTEST_ID*");
        return;
    }
    var contest_id = args[0].trim();
    if (isNaN(contest_id)) {
        client.sendMessage(message.from, "Please enter a valid CONTEST_ID.\nUsage:\n*.performance CONTEST_ID*");
        return;
    }
    var groupid = message.from;
    var handles = CONFIG.groups[groupid].handles;
    if (handles.length == 0) {
        client.sendMessage(message.from, "No users in the list. Please add users using .adduser command.\n\nUsage:\n*.adduser Handle1 Handle2 ...*");
        return;
    }
    var reply = await get_standings(contest_id, handles);
    client.sendMessage(message.from, reply);
}


async function CommandRatings(message) {
    var isGroup = is_group(message);
    if (!isGroup) {
        client.sendMessage(message.from, "This command is only available in groups‼️");
        return;
    }
    var groupid = message.from;
    var handles = CONFIG.groups[groupid].handles;   // This is in lower case
    if (handles.length == 0) {
        client.sendMessage(message.from, "No users in the list. Please add users using .adduser command.\n\nUsage:\n*.adduser Handle1 Handle2 ...*");
        return;
    }
    var ratings = await get_ratings(handles);
    handles = Object.keys(ratings)  // This is in actual case
    handles.sort(function(a,b) {return ratings[b] - ratings[a]});
    var reply = "*Ratings of handles in the group:*\n\n\n```";
    reply += "       Handle       | Ratings\n";
    reply += "=============================\n";
    for (var i = 0; i < handles.length; i++) {
        var handle = handles[i];
        var rating = ratings[handle];
        var logo = logo_of(rating);
        reply += `${logo}${left_align(handle, 18)}|  ${rating}\n`;
    }
    reply += "=============================```";
    client.sendMessage(message.from, reply);
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
                    msg += "*" + contests[i].name + "*🌐\nContest ID: *" + contests[i].id + "*\n" + time + "​📅​\n" + timeLeft + "⏰​\n\n";
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


async function user_exists(handle) {
    var url = `https://codeforces.com/api/user.info?handles=${handle}`;
    var resp = await fetch(url);
    var json_resp = await resp.json();
    // console.log(json);
    if (json_resp.status == "OK") {
        return true;
    }
    return false;
}


async function get_standings(contestid, handles) {    
    var url = `https://codeforces.com/api/contest.standings?contestId=${contestid}&handles=${handles.join(";")}`;
    var response = null; var json_resp = null;
    try {
        response = await fetch(url);
        json_resp = await response.json();
    }
    catch (e) {
        console.log("CodeForces is down!");
        return "CodeForces is down⚠️";
    }
    if (json_resp.status != "OK") {
        return json_resp.comment + "⚠️";
    }
    // console.log(json["result"]["rows"]);
    var contest_name = json_resp.result.contest.name;
    var performance = [];
    for (var i = 0; i < json_resp.result.rows.length; i++) {
        var r = json_resp.result.rows[i];
        var handle = r.party.members[0].handle;
        var rank = r.rank;
        var solved_cnt = 0;
        for (var j=0; j<r.problemResults.length; j++) {
            if (r.problemResults[j].points > 0) {
                solved_cnt++;
            }
        }
        performance.push([handle, rank, solved_cnt]);
    }
    performance.sort(function(a,b) {a[1] - b[1]});
    // console.log(performance);

    // Now fetching ratings of users
    var ratings = await get_ratings(handles);
    if (ratings == null) {
        return "CodeForces is down⚠️";
    }
    // console.log(ratings);

    var msg = `*Performance of Coders in ${contest_name} 🌐*\n\n\n`;
    if (performance.length > 0) {
        msg += "```       Handle       Solved Rank\n";
        msg +=    "===============================\n";
        for (var i = 0; i < performance.length; i++) {
            msg += `${logo_of(ratings[performance[i][0]])}${left_align(performance[i][0], 18)}|${left_align(performance[i][2], 3)}| ${performance[i][1]}\n`;
            delete ratings[performance[i][0]];
        }
        msg +=    "===============================```\n\n";
    }
    var absents = Object.keys(ratings);
    absents.sort(function(a,b) {return ratings[b] - ratings[a]});
    if (absents.length > 0) {
        msg += "*Coders who participated virtually or didn't participated*🚫\n```";
        for (var i = 0; i < absents.length; i++) {
            msg += `${logo_of(ratings[absents[i]])}${left_align(absents[i], 26)}\n`;
        }
        msg += "```";
    }

    return msg;
}


function left_align(handle, len) {
    if (handle.length >= len) {
        return handle.substring(0, len);
    }
    handle = " " + handle;
    while (handle.length < len) {
        handle += " ";
    }
    return handle;
}


function logo_of(r) {
    // 🔴 Grandmaster
    // 🟠 Master
    // 🟣 Candidate Master
    // 🔵 Expert
    // 🟡 Specialist
    // 🟢 Pupil
    // ⚪ Newbie
    if (r >=2400) {
        return "🔴";
    }
    if (r >= 2100) {
        return "🟠";
    }
    if (r >= 1900) {
        return "🟣";
    }
    if (r >= 1600) {
        return "🔵";
    }
    if (r >= 1400) {
        return "🟡";
    }
    if (r >= 1200) {
        return "🟢";
    }
    return "⚪";
}

async function get_ratings(handles) {
    // NOTE: This function has key as handle with actual case. It may not be lower case!
    var url = `https://codeforces.com/api/user.info?handles=${handles.join(';')}`;
    // console.log(url);
    var json_resp = null;
    try  {
        var resp = await fetch(url);
        json_resp = await resp.json();
        if (json_resp.status != "OK") {
            console.log("Error: " + json_resp.comment);
            return null;
        }
    } catch (e) {
        console.log("Error: " + e);
        return null;
    }
    // console.log(json_resp);
    ratings_data = {};
    for (var i = 0; i < json_resp.result.length; i++) {
        var r = json_resp.result[i];
        if (r.rating == undefined) {
            r.rating = 0;
        }
        ratings_data[(r.handle)] = r.rating;
    }
    return ratings_data;
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

function update_ratings() {
    try {
        // console.log("Writing config file...");
        fs.writeFileSync(ratings_file, JSON.stringify(RATINGS, null, 4));
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
    setTimeout(send_reminder, 60000);
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
Alias: *.frequency*

*.reminder HOURS*
_Sets the time in hours before which the bot will start sending reminders_

*.adduser handle1 handle2 ...*
_Adds the CodeForces handles to the list_
Alias: *.add*

*deleteuser handle1 handle2 ...*
_Removes the CodeForces handles from the list_
Alias: *.delete  .remove  .removeuser*

*listusers*
_Sends a list of all handles in the group_
Alias: *.list*

*performance CONTEST_ID*
_Sends the performance of all users in that contest_
Alias: *.perf*

*ratings*
_Sends the ratings of all users in the group_

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

Feel free to share this bot🤖 with your friends!

Any feedback or suggestions are welcome! 😊

Credits:
*whatsapp-web.js*

🗓Date programmed:
*26 June, 2022*
`;