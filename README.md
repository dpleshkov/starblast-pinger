# starblast-pinger

Utility tool to ping and get the info of a running Starblast game lobby.

## Installation

```bash
npm install starblast-pinger
yarn add starblast-pinger
pnpm add starblast-pinger
```

## Usage

```js
const pinger = require("starblast-pinger");

// Get system info
pinger.getSystemInfo("https://starblast.io/#1234", { options }).then(console.log).catch(console.error);
```
Options to pass into the `options` object:

| Option | Type |Description | Default value<br>(if null/undefined or omitted) |
| - | - | - | - |
| players | boolean | Whether or not to fetch player names<br>Please note that fetching player names is typically a way more expensive action. | true |
| timeout | positive integer | Timeout for fetching system info in general | 5000 |
| playersTimeout | positive integer | Timeout for fetching player names, counting after system info is successfully fetched | 3000 |
| preferredRegion | string | Preferred region in case there are multiple games in different regions with the same ID | none |
| maxGetID | positive integer | To declare the highest player ID to get | 3x the fetching game's capacity (if found) |

Note that if `options` is `null`, `undefined` or omitted, everything will go by their default values

For example:
```js
pinger.getSystemInfo('https://starblast.io/#5349', {
    players: true,
    playersTimeout: 3000,
    timeout: 5000,
    preferredRegion: "America",
    maxGetID: null
}).then(console.log).catch(console.error);
```

If fetching names from multiple game systems, it is recommended to do so asynchronously.

If the ping fails by any reason, the promise rejects with a specific error.

If successful, it should return something akin to this (players object is only present if the players parameter is set to `true`):

```js
{
  version: 84,
  seed: 6373,
  servertime: 285110,
  name: 'Tuchiraph 314',
  systemid: 6373,
  size: 800,
  mode: {
    max_players: 70,
    crystal_value: 2,
    crystal_drop: 1,
    map_size: 80,
    map_density: null,
    lives: 4,
    max_level: 7,
    friendly_colors: 3,
    close_time: 30,
    close_number: 0,
    map_name: null,
    unlisted: false,
    survival_time: 0,
    survival_level: 8,
    starting_ship: 101,
    starting_ship_maxed: false,
    asteroids_strength: 1,
    friction_ratio: 1,
    speed_mod: 1.2,
    rcs_toggle: true,
    weapon_drop: 0,
    mines_self_destroy: true,
    mines_destroy_delay: 18000,
    healing_enabled: true,
    healing_ratio: 1,
    shield_regen_factor: 1,
    power_regen_factor: 1,
    auto_refill: false,
    projectile_speed: 1,
    strafe: 0,
    release_crystal: true,
    large_grid: false,
    max_tier_lives: 0,
    auto_assign_teams: false,
    station_size: 2,
    crystal_capacity: [ 800, 1600, 3200, 6400 ],
    deposit_shield: [ 5000, 6000, 7000, 8000 ],
    spawning_shield: [ 4000, 4500, 5000, 5500 ],
    structure_shield: [ 2000, 2500, 3000, 3500 ],
    deposit_regen: [ 16, 19, 22, 25 ],
    spawning_regen: [ 13, 14, 16, 18 ],
    structure_regen: [ 8, 10, 11, 12 ],
    repair_threshold: 0.25,
    id: 'team',
    restore_ship: null,
    teams: [ [Object], [Object], [Object] ]
  },
  region: 'America',
  players: [
    { id: 1, hue: 96, player_name: 'NYOTA UHURA', custom: null },
    { id: 3, hue: 324, player_name: 'ARKADY DARELL', custom: null },
    { id: 4, hue: 48, player_name: 'EXAMPLE PLAYER', custom: null },
    { id: 5, hue: 252, player_name: 'ANOTHER PLAYER', custom: [Object] },
    { id: 6, hue: 12, player_name: 'EBLING MIS', custom: [Object] }
  ]
}
```

If you're not interested in any detailed info, a method `.canPing` takes in a system URL and returns a `Promise<Boolean>`
which resolves to `true` if it can join a system, and `false` if it fails (game is full or doesn't exist, connection unexpectedly closed, etc.)
