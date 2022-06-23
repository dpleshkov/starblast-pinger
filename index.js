// starblast-pinger
// Copyright 2022 Dmitry Pleshkov

const {WebSocket} = require("ws");
const axios = require("axios");

// Returns simstatus.json
const getSimStatus = async function () {
  try {
    let response = await axios.get(`https://starblast.io/simstatus.json?cachebypass=${Math.random()}`);
    return response.data || [];
  }
  catch (e) {
    throw new Error('Failed to fetch the serverlist file')
  }
}

// converts link into game and server address
const parseLink = function (link) {
  let match = String(link).match(/^[\n\t\r\s]*(\w+\:\/\/){0,1}(.+\@){0,1}starblast\.io(\:443){0,1}\/*(beta\/){0,1}((index|app|mobile)\.html){0,1}(\?[^\t\r\n\s\#\/\\]*)*\#(\d+)(\@(\w.+)\:(\d+)){0,1}[^\s\t\n\r]*[\n\t\r\s]*$/);
  return {
    id: match?.[8] != null ? +match[8] : null,
    server: match?.[9] != null ? {
      ip: match[9],
      port: match?.[11] != null ? +match[11] : null
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
    if (address.server == null) {
        let id = address.id;
        let simStatus = await getSimStatus();
        if (preferredRegion != null) simStatus.sort((sA, sB) => (sB.location === preferredRegion) - (sA.location === preferredRegion));
        Search: for (let location of simStatus) {
            for (let system of location.systems) {
                if (system.id === id) {
                    let splitter = location.address.split(":");
                    address.server = {
                      ip: splitter[0],
                      port: +splitter[1]
                    }
                    break Search
                }
            }
        }
    }
    if (address.server == null) throw new Error("No public games found with given game ID. Please provide server address in the link if you want to ping a custom game");
    address.server.ws = `wss://${address.server.ip.replace(/\./g, "-")}.starblast.io:${address.server.port}/`;
    return address
}

// Gets system info given URL
const getSystemInfo = function (url = String(), options = {preferredRegion: null, players: false, playersTimeout: 3000, timeout: 5000}) {
    try {
        return new Promise((resolve, reject) => {
            getWebSocketAddress(url, options.preferredRegion).then(info => {
              try {
                  options.timeout = Math.trunc(Math.max(options.timeout, 1)) || 5000;
                  options.playersTimeout = Math.trunc(Math.max(options.playersTimeout, 1)) || 3000;
                  let output, error;
                  let socket = new WebSocket(info.server.ws, "echo-protocol", {origin: "https://starblast.io"});
                  let closeSocket = function (socket) {
                    if (!socket.__CLOSED__) {
                      socket.__CLOSED__ = true;
                      socket.close()
                    }
                  }, setError = function (message) {
                    if (error == null) {
                      error = message;
                      closeSocket(socket)
                    }
                  }
                  let generalTimeout = setTimeout(setError, options.timeout, "Connection timed out"), playersTimeout;
                  socket.on('open', function () {
                      socket.send(JSON.stringify({
                          "name": "join",
                          "data": {
                              "spectate": false,
                              "spectate_ship": 1,
                              "player_name": "starblast-pinger",
                              "hue": 240,
                              "preferred": info.id,
                              "bonus": "true",
                              "steamid": null,
                              "create": false,
                              "client_ship_id": String(Math.random()).slice(2),
                              "client_tr": 2.799774169921875
                          }
                      }));
                  });
                  socket.on('message', function (message, isBinary) {
                      if (socket.__CLOSED__) return socket.close();
                      if (!isBinary) try {
                          let data = JSON.parse(message.toString());
                          if (data.name === "welcome") {
                              clearInterval(generalTimeout);
                              output = data.data;
                              if (options.players) {
                                  output.players = [];
                                  for (let x = 0; x <= (Math.trunc(Math.max(options.maxGetID, 0)) || output.mode.max_players * 3); ++x) {
                                      socket.send(JSON.stringify({
                                          "name": "get_name",
                                          "data": {
                                              "id": x
                                          }
                                      }));
                                  }
                                  playersTimeout = setTimeout(closeSocket, options.playersTimeout, socket);
                              }
                              else closeSocket(socket)
                          }
                          else if (data.name === "cannot_join") setError("Could not join the requested game. Perhaps the game is full/empty or has expired?");
                          else if (data.name === "player_name") output.players.push(data.data)
                      } catch (e) {}
                  });
                  socket.on('close', function () {
                      clearTimeout(generalTimeout);
                      clearTimeout(playersTimeout);
                      if (output) {
                        delete output.mode.restore_ship;
                        output.players?.sort?.((a, b) => a.id - b.id);
                        resolve(output)
                      }
                      else reject(new Error(error ?? "Connection closed unexpectedly. Perhaps your IP has gotten rate-limited by the Starblast servers?"))
                  });
                  socket.on('error', function() {
                      setError("An error occured while establishing connection to the game");
                  })
              } catch (e) {
                  reject(new Error("An unknown error occured. Please contact @dankdmitron#5029 in Discord if this happens"))
              }
            }).catch(reject)
        });
    } catch (e) {
        reject(new Error("An unknown error occured. Please contact @dankdmitron#5029 in Discord if this happens"))
    }
}

const systemExists = async function(url) {
  try {
    let info = await getSystemInfo(url);
    return true
  }
  catch (e) {
    return false
  }
}

module.exports.getWebSocketAddress = getWebSocketAddress;
module.exports.getSimStatus = getSimStatus;
module.exports.getSystemInfo = getSystemInfo;
module.exports.systemExists = systemExists;
