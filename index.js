// starblast-pinger
// Copyright 2022 Dmitry Pleshkov

const {WebSocket} = require("ws");
const axios = require("axios");

// Returns simstatus.json
const getSimStatus = async function () {
    let response = await axios.get(`https://starblast.io/simstatus.json?cachebypass=${Math.random()}`);
    return response.data || [];
}

// converts link into game and server address
const parseLink = function (link) {
  let match = String(link).match(/^[\n\t\r\s]*(\w+\:\/\/){0,1}(.+\@){0,1}starblast\.io(\:443){0,1}\/*(beta\/){0,1}((index|app|mobile)\.html){0,1}(\?[^\t\r\n\s\#\/\\]*)*\#(\d+)\@(\w.+)\:(\d+)[^\s\t\n\r]*[\n\t\r\s]*$/);
  return {
    id: match?.[8] != null ? +match[8] : null,
    server: match?.[9] != null ? {
      ip: match[9],
      port: match?.[10] != null ? +match[10] : null
    } : null
  }
}

// Gets websocket address given game link
const getWebSocketAddress = async function (url = String(), preferredRegion) {
    if (!url) {
        throw new TypeError("System URL not provided.");
    }
    let address = parseLink(url);
    if (address.id == null) {
        throw new TypeError("Invalid URL provided. Make sure system URL is in the form \"https://starblast.io/#1234\" or \"https://starblast.io/#1234@127.0.0.1:3000\"");
    }
    let
    if (address.server == null) {
        let id = Number(address);
        let simStatus = await getSimStatus();
        if (preferredRegion != null) simStatus.sort((sA, sB) => (sB.location === preferredRegion) - (sA.location === preferredRegion));
        Search: for (let location of simStatus) {
            for (let systemIndex in location.systems) {
                let system = location.systems[systemIndex];
                if (system.id === id) {
                    let splitter = location.address.split(":");
                    let {ip, port} = address.server = {
                      ip: splitter[0],
                      port: +splitter[1]
                    }
                    break Search
                }
            }
        }
    }
    if (address.server == null) throw new Error("No public games found with given game ID. Please provide server address in the link if you want to ping a custom game");
    address.server.ws = `wss://${ip.replace(/\./g, "-")}.starblast.io:${port}/`;
    return address
}

// Gets system info given URL
const getSystemInfo = function (url = String(), options = {preferredRegion: null, players: false, playersTimeout: 250, timeout: 5000}) {
    try {
        return new Promise((resolve, reject) => {
            getWebSocketAddress(url, options.preferredRegion).then(info => {
              address = info.server.ws;
              let id = info.id;
              options.timeout = options.timeout || 5000;
              options.playersTimeout = options.playersTimeout || 250;
              try {
                  let done = false;
                  setTimeout(() => {
                      socket.close();
                      done = true;
                      reject(new Error("Timed out"));
                  }, options.timeout);
                  let socket = new WebSocket(address, "echo-protocol", {origin: "https://starblast.io"});
                  socket.onopen = function () {
                      socket.send(JSON.stringify({
                          "name": "join",
                          "data": {
                              "spectate": false,
                              "spectate_ship": 1,
                              "player_name": "starblast-pinger",
                              "hue": 240,
                              "preferred": id,
                              "bonus": "true",
                              "steamid": null,
                              "create": false,
                              "client_ship_id": String(Math.random()).slice(2),
                              "client_tr": 2.799774169921875
                          }
                      }));
                  }
                  let output;
                  socket.onmessage = function (message) {
                      let content = message.data;
                      if (typeof content === "string" && content.startsWith("{")) {
                          let data = JSON.parse(content);
                          if (data.name === "welcome") {
                              output = data.data;
                              if (options.players) {
                                  output.players = [];
                                  for (let x = 0; x <= output.mode.max_players * 3; x++) {
                                      socket.send(JSON.stringify({
                                          "name": "get_name",
                                          "data": {
                                              "id": x
                                          }
                                      }));
                                  }
                                  setTimeout(() => {
                                      done = true;
                                      socket.close();
                                      resolve(output);
                                  }, options.playersTimeout);
                              } else {
                                  done = true;
                                  socket.close();
                                  resolve(output);
                              }
                          } else if (data.name === "cannot_join") {
                              resolve({error: "cannot_join"});
                          } else if (data.name === "player_name") {
                              output.players[data.data.id] = data.data;
                          }
                      }
                  }
                  socket.onclose = function () {
                      if (!done) reject(new Error("Connection closed unexpectedly"));
                  }
                  socket.onerror = function() {
                      done = true;
                      socket.close();
                      reject(new Error("An error occured while establishing connection to the game"))
                  }
              } catch (e) {
                  reject(new Error("An unknown error occured. Please contact @dankdmitron#5029 in Discord if this error shows"))
              }
            }).catch(reject)
        });
    } catch (e) {
        reject(new Error("An unknown error occured. Please contact @dankdmitron#5029 in Discord if this error shows"))
    }
}

const systemExists = async function(url) {
  try {
    let info = await getSystemInfo(url);
    return !!info.mode;
  }
  catch (e) {
    return false
  }
}

module.exports.getWebSocketAddress = getWebSocketAddress;
module.exports.getSimStatus = getSimStatus;
module.exports.getSystemInfo = getSystemInfo;
module.exports.systemExists = systemExists;
