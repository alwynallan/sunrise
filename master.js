// Copyright (C) 2017 alwynallan@gmail.com
// Merry Christmas Sue!

var http = require('http');
var fs = require('fs');
const cp = require('child_process');

// https://www.npmjs.com/package/node-cron because it has destroy()
var cron = require('node-cron');

// https://github.com/simonlast/node-persist
var storage = require('node-persist');

// https://github.com/plasticrake/tplink-smarthome-api
const { Client } = require('tplink-smarthome-api');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bulb_page(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<!DOCTYPE html>\n');
  res.write('<html><head><title>Color Bulbs</title>\n');
  res.write('<link rel="stylesheet" href="demo.css">\n');
  res.write('<link rel="stylesheet" href="form-basic.css">\n');
  res.write('<script>\nfunction ajax_get(payload){\n'); // no response considered
  res.write('  var xhttp = new XMLHttpRequest();\n');
  res.write('  xhttp.open("GET", payload, true);\n');
  res.write('  xhttp.send();\n');
  res.write('  document.activeElement.blur();\n'); // remove focus from button
  res.write('}\n</script>\n');
  res.write('</head><body>\n');
  res.write('<header><h1>Color lightbulbs on local network</h1></header>\n');
  res.write('<div class="main-content"><div class="form-basic">\n');
  var client = new Client();
  let sleeper = sleep(400);
  var bulb_count = 0;
  client.startDiscovery();
  client.on('bulb-new', (bulb) => {
    if(bulb._sysInfo.is_color === 1) {
      bulb_count++;
      res.write('<h3>' + bulb.alias +
        ' <a href="sunrise.html?bulb=' + encodeURIComponent(bulb.alias).replace(/'/g, "%27") +
        '">Sunrise Settings</a> <button onclick="ajax_get(\'off?' + bulb.host +
        '\')">Off</button> <button onclick="ajax_get(\'demo?' + encodeURIComponent(bulb.alias).replace(/'/g, "%27") + 
        '\')">Demo</button></h3>\n');
    }
  });
  await sleeper;
  client.stopDiscovery();
  if(bulb_count == 0) res.write("<h3>No color bulbs found!</h3>\n");
  res.write('<div style="text-align: left; margin-top: 2em;"><a href="https://github.com/alwynallan/sunrise">Source on GitHub</a></div>\n');
  res.write('</div></div>\n</body>\n</html>\n');
  res.end();
}

function index_page(res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<!DOCTYPE html>\n');
  res.write('<html><head><title>Index</title>\n');
  res.write('<link rel="stylesheet" href="demo.css">\n');
  res.write('<link rel="stylesheet" href="form-basic.css">\n');
  res.write('</head>\n<body>\n');
  res.write('<header><h1>Index of node subsystem</h1></header>\n');
  res.write('<div class="main-content"><div class="form-basic">\n');
  res.write('<h3><a href="bulbs.html">bulbs.html</a></h3><br>\n');
  res.write('<p>whoami: ' + cp.execSync('whoami') + '</p>\n');
  res.write('</div></div>\n');
  res.write('</body></html>');
  res.end();
}

function css_file(filename, res) {
  fs.readFile(filename, function(error, content) {
    if (error) {
      res.writeHead(500);
      res.end();
    }
    else {                   
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(content, 'utf-8');                  
    }
  });
}

function html_file(filename, res) {
  fs.readFile(filename, function(error, content) {
    if (error) {
      res.writeHead(500);
      res.end();
    }
    else {                   
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(content, 'utf-8');                  
    }
  });
}

function do_off(host_ip) {
  var client = new Client();
  client.getDevice({host: host_ip}).then((device) => {
    device.lighting.setLightState({
      transition_period: 500,
      on_off: false
    });
  });
}

function do_demo(bulbName) {
  let key = 'bulb_' + bulbName + '.json';
  let value = storage.getItemSync(key);
  cp.fork('sunrise-tp.js', [bulbName, '2', value.color1, value.color2, value.final]);
}

function do_backend(req, res) {
  // replaces sunrise_backend.php, assumes POST
  var jsonString = '';
  req.on('data', function (data) {
     jsonString += data;
  });
  req.on('end', function () {
    let obj = JSON.parse(jsonString);
    obj.bulb = decodeURIComponent(obj.bulb);
    let key = 'bulb_' + obj.bulb + '.json';
    switch(obj.command) {
      case 'save':
        delete obj.command;
        delete obj.default;
        storage.setItemSync(key, obj);
        //console.log("The config was saved!");
        if(tasks.hasOwnProperty(obj.bulb)){
          tasks[obj.bulb].destroy();
          delete tasks[obj.bulb];
        }
        addCron(obj); // checks if it is active and adds it back if it is
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('File saved: ' + key);
        break;
      case 'load':
        if(storage.keys().indexOf(key) === -1) {
          let def = {default: true, active: true, start: '05:30', duration: '30',
                     mon: true, tue: true,  wed:true, thu: true, fri: true, sat: false, sun: false,
                     color1: '#be45be', color2: '#f3ae52', final: '100'};
          def.bulb = obj.bulb;
          let deftxt = JSON.stringify(def);
          storage.setItemSync(key, def);
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(deftxt);
        }
        else {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end(JSON.stringify(storage.getItemSync(key)));
        }
        break;
      default:
        console.log('error: invalid command');
        console.log(obj);
        break;
    }
  });
}

function responer(req, res) {
  let [page, args] = req.url.split('?',2);
  //console.log('page: ' + page + ' args: ' + args);
  switch (page) {
    case '/bulbs.html':
      bulb_page(res);
      break;
    case '/':
    case '/index.html':
      index_page(res);
      break;
    case '/sunrise.html':
      html_file(page.substr(1), res);
      break;
    case '/demo.css':
    case '/form-basic.css':
      css_file(page.substr(1), res);
      break;
    case '/off':
      do_off(args);
      res.end();
      break;
    case '/demo':
      do_demo(decodeURIComponent(args));
      res.end();
      break;
    case '/backend':
      do_backend(req, res);
      break;
    case '/wipe.i.know.what.im.doing':
      storage.clearSync();
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Your storage is wiped out!');
      break;
    default:
      res.writeHead(404);
      res.end();
      break;
  }
}

function sunriseSim (bulbName) {
  //console.log('Doing sim for ' + bulbName);
  let key = 'bulb_' + bulbName + '.json';
  let value = storage.getItemSync(key);
  cp.fork('sunrise-tp.js', [bulbName, value.duration, value.color1, value.color2, value.final]);
}

function addCron(v) {
  //console.log(v);
  if(v.active){
    let parts = v.start.split(":",2);
    if (isNaN(parts[0]) || parts[0] === '') parts[0] = 0; // cron is very picky
    if (isNaN(parts[1]) || parts[1] === '') parts[1] = 0;
    let hour = parts[0];
    let min = parts[1];
    let wday = (v.sun?'0,':'') + (v.mon?'1,':'') + (v.tue?'2,':'') + (v.wed?'3,':'') + (v.thu?'4,':'') + (v.fri?'5,':'') + (v.sat?'6,':'');
    wday = wday.replace(/,$/, '');
    if(wday === '') wday = '*'; // none is all
    let cronStr = '0 ' + parseInt(min) + ' ' + parseInt(hour) + ' * * ' + wday;
    //console.log('scheduling ' + v.bulb + ' at ' + cronStr);
    tasks[v.bulb] = cron.schedule(cronStr, function(){sunriseSim(v.bulb);});
  }
}

var tasks = {};
storage.initSync();
for (var i=0; i < storage.values().length; i++) addCron(storage.values()[i]);
var server = http.createServer(responer);
server.listen(8000);
