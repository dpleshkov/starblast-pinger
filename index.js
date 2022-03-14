// starblast-pinger
// Copyright 2022 Dmitry Pleshkov

const {WebSocket} = require("ws");
const axios = require("axios");

// Returns simstatus.json
const getSimStatus = async function () {
    let response = await axios.get(`https://starblast.io/simstatus.json?cachebypass=${Math.random()}`);
    return response.data || [];
}

// Gets websocket address given game link
const getWebSocketAddress = async function (url = String()) {
    if (!url) {
        throw new TypeError("System URL not provided.");
    }
    let address = url.split("#")[1];
    if (!address) {
        throw new TypeError("Invalid URL provided. Make sure system URL is in the form \"https://starblast.io/#1234\"");
    }
    if (address.split("@").length === 1) {
        let id = Number(address);
        let simStatus = await getSimStatus();
        for (let locationIndex in simStatus) {
            let location = simStatus[locationIndex];
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
            if (exit) break;
        }
    } else if (address.split("@").length === 2) {
        let server = address.split("@")[1];
        let ip = server.split(":")[0];
        let port = server.split(":")[1];
        ip = ip.replaceAll(".", "-");
        return `wss://${ip}.starblast.io:${port}/`;
    }
}

// Gets system info given URL
const getSystemInfo = async function (url = String(), options = {players: false, playersTimeout: 250, timeout: 5000}) {
    try {
        let address = await getWebSocketAddress(url);
        let id = Number(url.split("#")[1].split("@")[0]);
        if (!address) return {error: "address"};
        options.timeout = options.timeout || 5000;
        options.playersTimeout = options.playersTimeout || 250;
        return new Promise((resolve) => {
            try {
                setTimeout(() => {
                    resolve({error: "timeout"})
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
                                output.players = {};
                                for (let x = 0; x <= output.mode.max_players * 3; x++) {
                                    socket.send(JSON.stringify({
                                        "name": "get_name",
                                        "data": {
                                            "id": x
                                        }
                                    }));
                                }
                                setTimeout(() => {
                                    socket.close();
                                    resolve(output);
                                }, options.playersTimeout);
                            } else {
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
                    resolve({"error": "closed"});
                }
            } catch {
                resolve({"error": "error"});
            }
        });
    } catch {
        return {"error":"error"};
    }
}

const systemExists = async function(url) {
    let info = await getSystemInfo(url);
    return !!info.mode;
}

module.exports.getWebSocketAddress = getWebSocketAddress;
module.exports.getSimStatus = getSimStatus;
module.exports.getSystemInfo = getSystemInfo;
module.exports.systemExists = systemExists;