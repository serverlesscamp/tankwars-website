---
layout: default
title: API
---

# API 

## Tank info

Your `/info` URL API will receive a GET request. Reply with JSON:

```
{
  name: string, /* tank name */
  owner: string /* tank author/owner */
}

## Tank command 

Your `/command` URL API will receive the following into using HTTP POST, as JSON

```
{
  matchId: string, /* unique ID for each match */
  mapWidth: int, 
  mapHeight: int, 
  wallDamage: int, /* how much damage does it cause to run into a wall */
  tankDamage: int, /* how much damage does it cause to run into a tank -- also, how much damage your tank causes when it runs into a wall */
  weaponDamage: int, /* how much damage does it cause to hit something with a bullet */
  visibility: int, /* how far, in fields, you can see on your radar */
  weaponRange: int, /* how far, in fields, you can hit with a bullet */
  you: TANK, 
  enemies: [TANK],
  walls: [WALL]
};
```

### Tank

* you can only see a summary for far-away tanks 

```
{ strength: int }
```

* you can see full tank info for yourself and tanks in your visibility zone

```
{ 
  x: int, 
  y: int, 
  strength: int, 
  direction: string, /* 'left', 'right', 'top', 'bottom' */
  ammo: int,
  status: string
}
```

### Wall

* you can only see walls in your visibility zone

```
{ 
  x: int, 
  y: int, 
  strength: int 
}
```

## Reply format

Reply with JSON: 

```
{
  command: string /* turn-left, turn-right, forward, reverse, fire */
}
```

### Example request
```
{
  "mapWidth": 30,
  "mapHeight": 20,
  "wallDamage": 30,
  "tankDamage": 50,
  "weaponDamage": 60,
  "visibility": 5,
  "weaponRange": 5,
  "you": {
    "direction": "left",
    "x": 18,
    "y": 0,
    "strength": 60,
    "ammo": 1000,
    "status": "moving"
  },
  "enemies": [
    {
      "strength": 300
    }
  ],
  "walls": [
    {
      "x": 15,
      "y": 1,
      "strength": 200
    },
    {
      "x": 21,
      "y": 2,
      "strength": 200
    },
    {
      "x": 21,
      "y": 1,
      "strength": 200
    }
  ],
  "matchId": "368f865a-0143-42ac-9a42-7d8b30f482b7"
}
```
