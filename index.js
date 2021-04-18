// Starblast Server Pinger
// Copyright 2021 Dmitry Pleshkov


const WebSocketClient = require("websocket").client;
const axios = require("axios");

/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(str, newStr){

        // If a regex pattern
        if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
            return this.replace(str, newStr);
        }

        // If a string
        return this.replace(new RegExp(str, 'g'), newStr);

    };
}

let sendJSON = (connection, json) => {
    if (connection.connected) {
        //console.log("Sending:", JSON.stringify(json));
        connection.sendUTF(JSON.stringify(json));
    }
}

let getSimstatus = async function () {
    let response = await axios.get("https://starblast.io/simstatus.json");
    response.data = response.data || [];
    return response.data;
}

let getWebsocketAddress = async function (url) {
    if (!url) {
        return;
    }
    let address = url.split("#")[1];
    if (address.split("@").length === 1) {
        let id = Number(address);
        let simstatus = await getSimstatus();
        for (let locationIndex in simstatus) {
            let location = simstatus[locationIndex];
            let exit = false;
            for (let systemIndex in location.systems) {
                let system = location.systems[systemIndex];
                if (system.id === id) {
                    let ip = location.address.split(":")[0];
                    let port = location.address.split(":")[1];
                    ip = ip.replaceAll(".", "-");
                    return `wss://${ip}.starblast.io:${port}/`;
                }
            }
            if (exit) {
                break;
            }
        }
    } else if (address.split("@").length === 2) {
        let server = address.split("@")[1];
        let ip = server.split(":")[0];
        let port = server.split(":")[1];
        ip = ip.replaceAll(".", "-");
        return `wss://${ip}.starblast.io:${port}/`;
    }
}

let getSystemInfo = async function (url, players, playersTimeout) {
    if (!url) {
        return;
    }
    let address = await getWebsocketAddress(url);
    let id = Number(url.split("#")[1].split("@")[0]);
    let welcomeMessage;
    playersTimeout = playersTimeout || 1000;
    players = players || false;
    if (address) {
        return new Promise((resolve, reject) => {
            let client = new WebSocketClient();
            client.on = client.on || function () {};
            client.on('connectFailed', function (error) {
                reject('Connect Error: ' + error.toString());
            });
            client.on('connect', function (connection) {
                connection.on('error', function (error) {
                    reject('Connection Error: ' + error.toString());
                });
                connection.on('close', function () {
                });
                connection.on('message', function (message) {
                    if (message.type === 'utf8' && message.utf8Data.startsWith("{")) {
                        //console.log("Received: ",message.utf8Data);
                        let parsedMessage = JSON.parse(message.utf8Data);
                        if (parsedMessage.name === "welcome") {
                            welcomeMessage = parsedMessage.data;
                            //console.log(parsedMessage);
                            //console.log("players", players)
                            welcomeMessage.players = {};
                            if (players) {
                                //console.log("OK");
                                parsedMessage.data.mode.max_players = parsedMessage.data.mode.max_players || 0;
                                let maxPlayers = parsedMessage.data.mode.max_players;
                                //console.log("max players",maxPlayers)
                                for (let x=0; x<=maxPlayers; x++) {
                                    sendJSON(connection, {
                                        "name": "get_name",
                                        "data": {
                                            "id": x
                                        }
                                    });
                                }
                                setTimeout(() => {
                                    connection.close();
                                    resolve(welcomeMessage);
                                }, playersTimeout);
                            } else {
                                connection.close();
                                resolve(JSON.parse(message.utf8Data).data);
                            }
                        } else if (parsedMessage.name === "player_name") {
                            welcomeMessage.players[parsedMessage.data.id] = parsedMessage.data;
                            if (welcomeMessage.players.length === welcomeMessage.mode.max_players) {
                                resolve(welcomeMessage);
                            }
                        }
                        // connection.close();
                        // resolve(JSON.parse(message.utf8Data).data);
                    } else {
                        // reject("Invalid response from server.")
                    }
                });
                sendJSON(connection, {
                    "name": "join",
                    "data": {
                        "spectate": false,
                        "spectate_ship": 1,
                        "player_name": "PING",
                        "hue": 240,
                        "preferred": id,
                        "bonus": "true",
                        "steamid": null,
                        "create": false,
                        "client_ship_id": "35574142321707652006",
                        "client_tr": 2.799774169921875
                    }
                });
            });
            client.connect(address, 'echo-protocol', "https://starblast.io");
        });
    }
    return new Promise((resolve) => {
        resolve({});
    });
}

module.exports.getSystemInfo = getSystemInfo;
module.exports.getSimstatus = getSimstatus;
