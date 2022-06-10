const fetch = require('node-fetch');

async function get_ratings(handles)
{
    var url = `https://codeforces.com/api/user.info?handles=${handles.join(';')}`;
    console.log(url);
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
        ratings_data[(r.handle).toLowerCase()] = r.rating;
    }
    return ratings_data;
}

async function check(handle) {
    console.log(await get_ratings(handle));
}

check(["theviking733n","the.viking"]);