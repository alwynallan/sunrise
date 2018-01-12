var SunCalc = require('suncalc');

//https://stackoverflow.com/questions/25275696/javascript-format-date-time
function formatDate(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return date.getMonth()+1 + "/" + date.getDate() + "/" + date.getFullYear() + "  " + strTime;
}

// https://www.iplocation.net/index.php
// https://www.iplocation.net/go/maxmind
// 40.0396	-75.4225

// Google Earth: 40.05651644814395, -75.4198111564648
var loc = ["Devon, PA", 40.05651644814395, -75.4198111564648];

var now = new Date();

console.log('In ' + loc[0]);

var times = SunCalc.getTimes(now, loc[1], loc[2]);

console.log(' Sunrise: ' + formatDate(times.sunrise));
console.log('  Sunset: ' + formatDate(times.sunset));

var mtimes = SunCalc.getMoonTimes(now, loc[1], loc[2]);

console.log('Moonrise: ' + formatDate(mtimes.rise));
console.log(' Moonset: ' + formatDate(mtimes.set));

console.log('15 degrees west');
loc[2] -= 15;

var times = SunCalc.getTimes(now, loc[1], loc[2]);

console.log(' Sunrise: ' + formatDate(times.sunrise));
console.log('  Sunset: ' + formatDate(times.sunset));

var mtimes = SunCalc.getMoonTimes(now, loc[1], loc[2]);

console.log('Moonrise: ' + formatDate(mtimes.rise));
console.log(' Moonset: ' + formatDate(mtimes.set));