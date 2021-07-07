const pinger = require("./index");

pinger.getSystemInfo("https://starblast.io/#7304@45.76.56.134:3003", true, 1000).then(console.log);