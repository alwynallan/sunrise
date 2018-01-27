// Copyright (C) 2017 alwynallan@gmail.com
// Merry Christmas Sue!

// This is forked from master.js but can also be invoked from the command line for testing
// e.g. 'node sunrise-tp "Peter's Lamp"'

const {
  Client
} = require('tplink-smarthome-api')

const client = new Client()

const steps12 = 50
const steps23 = 50
const stepsCtt = 60
const totalSteps = steps12 + steps23 + stepsCtt

// var host=null;
const bulbValue = decodeURIComponent(process.argv[2]) // should warn if it's not there
const durationValue = parseInt(process.argv[3]) || 45
const color1RGBH = process.argv[4] || '#07078f'
const color2RGBH = process.argv[5] || '#f3ae52'
const finalBright = parseInt(process.argv[6]) || 100
const color1HSV = rgb2hsv(hexToR(color1RGBH), hexToG(color1RGBH),
  hexToB(color1RGBH))
const color2HSV = rgb2hsv(hexToR(color2RGBH), hexToG(color2RGBH),
  hexToB(color2RGBH))
const color3HSV = [60, 18, 100] // visually similar to 2700
const ctStart = 2700
const ctBump = 15

// function sleep(ms) { // useful for development
//  return new Promise(resolve => setTimeout(resolve, ms));
// }

// http://www.javascripter.net/faq/hextorgb.htm
function hexToR (h) {
  return parseInt((cutHex(h)).substring(0, 2), 16)
}

function hexToG (h) {
  return parseInt((cutHex(h)).substring(2, 4), 16)
}

function hexToB (h) {
  return parseInt((cutHex(h)).substring(4, 6), 16)
}

function cutHex (h) {
  return (h.charAt(0) === '#') ? h.substring(1, 7) : h
}

// http://www.javascripter.net/faq/rgb2hsv.htm
function rgb2hsv (r, g, b) {
  var computedH = 0
  var computedS = 0
  var computedV = 0
  r /= 255.0
  g /= 255.0
  b /= 255.0
  var minRGB = Math.min(r, Math.min(g, b))
  var maxRGB = Math.max(r, Math.max(g, b))

  // Black-gray-white
  if (minRGB === maxRGB) {
    computedV = minRGB
    return [0, 0, parseInt(computedV * 100.99)]
  }

  // Colors other than black-gray-white:
  var d = (r === minRGB) ? g - b : ((b === minRGB) ? r - g : b - r)
  var h = (r === minRGB) ? 3 : ((b === minRGB) ? 1 : 5)
  computedH = 60 * (h - d / (maxRGB - minRGB))
  computedS = (maxRGB - minRGB) / maxRGB
  computedV = maxRGB
  return [parseInt(computedH), parseInt(computedS * 100.99), parseInt(
    computedV * 100.99)]
}

function cblend (ratio, color0, color1) {
  if (ratio < 0.0) ratio = 0.0
  if (ratio > 1.0) ratio = 1.0
  if (Math.abs(color0[0] - color1[0]) > 180.0) { // transition through hue=360
    let mov = color0[0] < color1[0]
        ? -((color0[0] - 0.0) + (360.0 - color1[0]))
        : (color1[0] - 0.0) + (360.0 - color0[0])
    let hue = color0[0] + ratio * mov
    if (hue > 360.0) hue -= 360.0
    if (hue < 0.0) hue += 360.0
    return [parseInt(hue),
      parseInt((1.0 - ratio) * color0[1] + ratio * color1[1]),
      parseInt((1.0 - ratio) * color0[2] + ratio * color1[2])
    ]
  }
  return [parseInt((1.0 - ratio) * color0[0] + ratio * color1[0]),
    parseInt((1.0 - ratio) * color0[1] + ratio * color1[1]),
    parseInt((1.0 - ratio) * color0[2] + ratio * color1[2])
  ]
}

var bumpLevelB
var bumpDevelDevice
var bumpLevelTimer = null
var bumpLevelTransition
var bumpLevelBeenSeenON = false

async function bumpLevel () {
  if (bumpLevelB > 0) {
    let state = await bumpDevelDevice.getPowerState()
    if (!state && bumpLevelBeenSeenON) {
      // console.log("User has turned the bulb off, exiting.");
      process.exit()
    }
    if (state) bumpLevelBeenSeenON = true
  }
  if (bumpLevelB <= steps12) {
    let color = cblend(bumpLevelB / 50.0, color1HSV, color2HSV)
    let h = color[0]
    let s = color[1]
    let v = parseInt((bumpLevelB * (finalBright - 1)) / 100 + 1)
    // console.log('h:' + h + ' s:' + s + ' v:' + v);
    await bumpDevelDevice.lighting.setLightState({
      hue: h,
      saturation: s,
      brightness: v,
      color_temp: 0,
      transition_period: bumpLevelTransition,
      on_off: true
    })
    bumpLevelB++
  } else if (bumpLevelB <= (steps12 + steps23)) {
    let color = cblend((bumpLevelB - 50.0) / 50.0, color2HSV,
      color3HSV)
    let h = color[0]
    let s = color[1]
    let v = parseInt((bumpLevelB * (finalBright - 1)) / 100 + 1)
    // console.log('h:' + h + ' s:' + s + ' v:' + v;
    await bumpDevelDevice.lighting.setLightState({
      hue: h,
      saturation: s,
      brightness: v,
      color_temp: 0,
      transition_period: bumpLevelTransition,
      on_off: true
    })
    bumpLevelB++
  } else if (bumpLevelB <= totalSteps) {
    let ct = ctStart + (bumpLevelB - 101) * ctBump
    // console.log('ct:' + ct);
    await bumpDevelDevice.lighting.setLightState({
      hue: 0,
      saturation: 0,
      brightness: finalBright,
      color_temp: ct,
      transition_period: bumpLevelTransition,
      on_off: true
    })
    bumpLevelB++
  } else {
    clearInterval(bumpLevelTimer)
    // console.log("All done!");
  }
}

async function doCycle (device) {
  bumpDevelDevice = device
  bumpLevelB = 0
  let pauseMs = (durationValue * 60000) / totalSteps
  bumpLevelTransition = pauseMs - 100
  setImmediate(bumpLevel)
  bumpLevelTimer = setInterval(bumpLevel, pauseMs)
}

// catch devices, look for the one we want
client.on('device-new', (device) => {
  device.getSysInfo().then(function (info) {
    if (info.alias === bulbValue) {
      // console.log(device);
      // console.log(info);
      endDiscovery()
      doCycle(device)
    }
  })
})

var discoveryTimer = null
var retries = 0

var endDiscovery = () => {
  clearTimeout(discoveryTimer)
  client.stopDiscovery()
}

var retryDiscovery = () => {
  if (retries) client.stopDiscovery()
  retries++
  if (retries < 6) {
    // console.log("Beginning try " + retries);
    client.startDiscovery()
    discoveryTimer = setTimeout(retryDiscovery, 400)
  }
}

// It would be nice, and possibly more reliable, to store and use each bulb's IP and use it with client.getDevice({host: host_ip}), but
// the IP could change over time, particularly if it assigned to a different WiFi network. So,
retryDiscovery()
