# starblast-pinger

Utility tool to ping and get the info of a running Starblast game lobby.

## Usage:

```js
const pinger = require("starblast-pinger");

pinger.getSystemInfo("https://starblast.io/#1234").then(console.log);
```

If the ping fails, it should return an empty object `{}`.

If successful, it should return something akin to this:

```
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
  region: 'America'
}

```