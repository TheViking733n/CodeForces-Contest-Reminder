const rp = require('request-promise');
const fetch = require('node-fetch');

const standings_endpoint = "https://codeforces.com/api/contest.standings?";

handles = ["TheViking733n", "kartik150704", "skhan_org", "pj02", "optimalknight"]
contestid = 1694


async function get_standings(contestid, handles) {    
    var url = standings_endpoint + "contestId=" + contestid + "&handles=" + handles.join(";");
    response = await fetch(url);
    json = await response.json();
    // console.log(json["result"]["rows"]);
    var contest_name = json.result.contest.name;
    var performance = [];
    for (var i = 0; i < json.result.rows.length; i++) {
        var r = json.result.rows[i];
        var handle = r.party.members[0].handle;
        var rank = r.rank;
        var solved_cnt = 0;
        for (var j=0; j<r.problemResults.length; j++) {
            if (r.problemResults[j].points > 0) {
                solved_cnt++;
            }
        }
        // var msg = contest_name + ": " + handle + " rank " + rank + " with " + solved_cnt + " solved problems";
        // console.log(msg);
        performance.push([handle, rank, solved_cnt]);
    }
    performance.sort(function(a,b) {a[1] - b[1]});
    console.log(performance);

    var msg = `*Performance of coders in ${contest_name}:*\n\n`;
    msg += "```       Handle      Solved Rank\n";
    for (var i = 0; i < performance.length; i++) {
        msg += `🟣${left_align(performance[i][0], 18)}|${left_align(performance[i][2], 3)}| ${performance[i][1]}\n`;
    }
    msg += "```";
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
async function main() {
    var out = await get_standings(contestid, handles);
    console.log(out);
}


main();

/**
⚪  0123456789012345  9  12345
🔴
🟠
🟡
🟢
🔵
🟣
🟤


Performance of coders in CodeForces Div 2:

        Handle      Solved Rank
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345

ㅤㅤㅤㅤHandle           Solved Rank
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345



Performance of coders in CodeForces Div 2:
🟢  0123456789012345  9  12345



ㅤㅤㅤㅤ Handle              Solved  Rank
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345
🟢 0123456789012345 | 9 | 12345

*/