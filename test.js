const pinger = require("./index");

pinger.getSystemInfo("https://starblast.io/#5897", true).then(console.log);