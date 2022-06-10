const fetch = require('node-fetch');


async function user_exists(handle)
{
    var url = `https://codeforces.com/api/user.info?handles=${handle}`;
    var resp = await fetch(url);
    json = await resp.json();
    // console.log(json);
    if (json.status == "OK") {
        return true;
    }
    return false;
}

async function check(handle) {
    console.log(await user_exists(handle));
}

check("theviking733n");