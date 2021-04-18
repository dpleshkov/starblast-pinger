const pinger = require("./index");

pinger.getSystemInfo("https://starblast.io/#3931", true, 1000).then(console.log);