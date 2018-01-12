// Copyright (C) 2017 alwynallan@gmail.com
// Merry Christmas Sue!

const {
  Client
} = require('tplink-smarthome-api');

const client = new Client();

const steps12 = 50;
const steps23 = 50;
const steps_ct = 60;
const total_steps = steps12 + steps23 + steps_ct;

//var host=null;
const bulb_value = decodeURIComponent(process.argv[2]); // should warn if it's not there
const duration_value = parseInt(process.argv[3]) || 45;
const color1_rgbh = process.argv[4] || "#07078f";
const color2_rgbh = process.argv[5] || "#f3ae52";
const final_bright = parseInt(process.argv[6]) || 100;
const color1_hsv = rgb2hsv(hexToR(color1_rgbh), hexToG(color1_rgbh),
  hexToB(color1_rgbh));
const color2_hsv = rgb2hsv(hexToR(color2_rgbh), hexToG(color2_rgbh),
  hexToB(color2_rgbh));
const color3_hsv = [60, 18, 100]; // visually similar to 2700
const ct_start = 2700;
const ct_bump = 15;

//function sleep(ms) { // useful for development
//  return new Promise(resolve => setTimeout(resolve, ms));
//}

// http://www.javascripter.net/faq/hextorgb.htm
function hexToR(h) {
  return parseInt((cutHex(h)).substring(0, 2), 16)
}

function hexToG(h) {
  return parseInt((cutHex(h)).substring(2, 4), 16)
}

function hexToB(h) {
  return parseInt((cutHex(h)).substring(4, 6), 16)
}

function cutHex(h) {
  return (h.charAt(0) == "#") ? h.substring(1, 7) : h
}

// http://www.javascripter.net/faq/rgb2hsv.htm
function rgb2hsv(r, g, b) {
  var computedH = 0;
  var computedS = 0;
  var computedV = 0;
  r /= 255.0;
  g /= 255.0;
  b /= 255.0;
  var minRGB = Math.min(r, Math.min(g, b));
  var maxRGB = Math.max(r, Math.max(g, b));

  // Black-gray-white
  if (minRGB == maxRGB) {
    computedV = minRGB;
    return [0, 0, parseInt(computedV * 100.99)];
  }

  // Colors other than black-gray-white:
  var d = (r == minRGB) ? g - b : ((b == minRGB) ? r - g : b - r);
  var h = (r == minRGB) ? 3 : ((b == minRGB) ? 1 : 5);
  computedH = 60 * (h - d / (maxRGB - minRGB));
  computedS = (maxRGB - minRGB) / maxRGB;
  computedV = maxRGB;
  return [parseInt(computedH), parseInt(computedS * 100.99), parseInt(
    computedV * 100.99)];
}

function cblend(ratio, color0, color1) {
  if (ratio < 0.0) ratio = 0.0;
  if (ratio > 1.0) ratio = 1.0;
  if (Math.abs(color0[0] - color1[0]) > 180.0) { // transition through hue=360
    let mov = color0[0] < color1[0] ?
        -((color0[0] - 0.0) + (360.0 - color1[0])) : 
        (color1[0] - 0.0) + (360.0 - color0[0]);
    let hue = color0[0] + ratio * mov;
    if (hue > 360.0) hue -= 360.0;
    if (hue < 0.0) hue += 360.0;
    return [parseInt(hue),
            parseInt((1.0 - ratio) * color0[1] + ratio * color1[1]),
            parseInt((1.0 - ratio) * color0[2] + ratio * color1[2])
    ];
  }
  return [parseInt((1.0 - ratio) * color0[0] + ratio * color1[0]),
          parseInt((1.0 - ratio) * color0[1] + ratio * color1[1]),
          parseInt((1.0 - ratio) * color0[2] + ratio * color1[2])
  ];
}

var bump_level_b;
var bump_level_device;
var bump_level_timer = null;
var bump_level_transition;
var bump_level_been_seen_on = false;

async function bump_level() {
  if (bump_level_b > 0) {
    let state = await bump_level_device.getPowerState();
    if (!state && bump_level_been_seen_on) {
      //console.log("User has turned the bulb off, exiting.");
      process.exit();
    }
    if(state) bump_level_been_seen_on = true;
  }
  if (bump_level_b <= steps12) {
    let color = cblend(bump_level_b / 50.0, color1_hsv, color2_hsv);
    let h = color[0];
    let s = color[1];
    let v = parseInt((bump_level_b * (final_bright - 1)) / 100 + 1);
    //console.log('h:' + h + ' s:' + s + ' v:' + v);
    await bump_level_device.lighting.setLightState({
      hue: h,
      saturation: s,
      brightness: v,
      color_temp: 0,
      transition_period: bump_level_transition,
      on_off: true
    });
    bump_level_b++;
  } else if (bump_level_b <= (steps12 + steps23)) {
    let color = cblend((bump_level_b - 50.0) / 50.0, color2_hsv,
      color3_hsv);
    let h = color[0];
    let s = color[1];
    let v = parseInt((bump_level_b * (final_bright - 1)) / 100 + 1);
    //console.log('h:' + h + ' s:' + s + ' v:' + v;
    await bump_level_device.lighting.setLightState({
      hue: h,
      saturation: s,
      brightness: v,
      color_temp: 0,
      transition_period: bump_level_transition,
      on_off: true
    });
    bump_level_b++;
  } else if (bump_level_b <= total_steps) {
    let ct = ct_start + (bump_level_b - 101) * ct_bump;
    //console.log('ct:' + ct);
    await bump_level_device.lighting.setLightState({
      hue: 0,
      saturation: 0,
      brightness: final_bright,
      color_temp: ct,
      transition_period: bump_level_transition,
      on_off: true
    });
    bump_level_b++;
  } else {
    clearInterval(bump_level_timer);
    //console.log("All done!");
  }
}

async function do_cycle(device) {
  bump_level_device = device;
  bump_level_b = 0;
  let pause_ms = (duration_value * 60000) / total_steps;
  bump_level_transition = pause_ms-100;
  setImmediate(bump_level);
  bump_level_timer = setInterval(bump_level, pause_ms);
}

// catch devices, look for the one we want
client.on('device-new', (device) => {
  device.getSysInfo().then(function(info) {
    if (info.alias === bulb_value) {
      //console.log(device);
      //console.log(info);
      do_cycle(device);
      endDiscovery();
    }
  });
});

var discovery_timer = null;
var endDiscovery = () => {
  clearTimeout(discovery_timer);
  client.stopDiscovery();
}

client.startDiscovery();
discovery_timer = setTimeout(endDiscovery, 4000);