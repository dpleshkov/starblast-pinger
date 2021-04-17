// Starblast Server Pinger
// Copyright 2021 Dmitry Pleshkov


const WebSocketClient = require("websocket").client;
const axios = require("axios");

let sendJSON = (connection, json) => {
    if (connection.connected) {
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

let getSystemInfo = async function (url) {
    if (!url) {
        return;
    }
    let address = await getWebsocketAddress(url);
    let id = Number(url.split("#")[1].split("@")[0]);
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
                    if (message.type === 'utf8') {
                        connection.close();
                        resolve(JSON.parse(message.utf8Data).data);
                    } else {
                        reject("Invalid response from server.")
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
