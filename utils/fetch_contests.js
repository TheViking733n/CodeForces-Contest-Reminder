const rp = require('request-promise');

const contest_url = "https://codeforces.com/api/contest.list?gym=false";

async function get_contests() {
    await rp (contest_url)
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
                let msg = "";
                for (let i = 0; i < contests.length; i++) {
                    // console.log(contests[i].name);
                    var time = convertTimestamp(contests[i].startTimeSeconds);
                    var timeLeft = parseTimeLeft(-parseInt(contests[i].relativeTimeSeconds));
                    msg += contests[i].name + "\n" + time + "\n" + timeLeft + "\n\n";
                }
                console.log(msg);
                return msg;
            }
            catch (e) {
                console.log("CodeForces is down!");
            }
        }
    )
        .catch(function (err) {
            console.log(err);
        });
}

function convertTimestamp(timestamp) {
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
      } else if (hh == 0) {
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
    var timeLeft = "Time Left: ";
    if (days > 0) {
        timeLeft += days + " d, ";
    }
    if (hours > 0) {
        timeLeft += hours + " h, ";
    }
    if (minutes > 0) {
        timeLeft += minutes + " min, ";
    }
    if (seconds > 0) {
        timeLeft += seconds + " sec";
    }
    return timeLeft;
}


// get_contests();


async function load_and_then_tell() {
    let contests = await get_contests();
    console.log("Contests loaded");
}

load_and_then_tell();
console.log("EOF");
