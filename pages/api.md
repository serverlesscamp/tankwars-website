---
layout: default
title: API Docs
body_class: api
---

# API 

Tanks are simple REST APIs with two endpoints:

* `/info`: should provide basic information on a tank. See [Info Endpoint](#info) for more information.
* `/command`: will receive map information, and needs to reply with a command for the tank. See the [Command Endpoint](#command) for more information

Check out the [Serverless Camp Example Tanks](https://github.com/serverlesscamp/tankwars-example-tanks) for some simple, fully working examples. 

# Info endpoint {#info}

Your `/info` URL API will receive a GET request. Reply with JSON in the following format:

{%highlight json%}
{
  "name": string, /* tank name */
  "owner": string /* tank author/owner */
}
{%endhighlight %}

# Command endpoint {#command}

Your `/command` URL API will receive information about the visible part of the map, and you need to reply with a command.

Check out the [Example Request](#example-request) and [Example Response](#example-response).

## Response format

You need to reply with `application/json` content type, and a JSON structure

{%highlight json%}
{
  "command": "string"
}
{%endhighlight%}

valid commands are:

* `turn-left`: turn 90 degrees counter-clockwise
* `turn-right`: turn 90 degrees clockwise 
* `forward`: move one field in the direction the tank is facing
* `reverse`: move one field in the opposite direction
* `fire`: shoot in the direction the tank is facing

The easiest way to see the effect of various commands is to manually send commands from the [Test Your API](/pages/test.html) page.

## Request format

Your endpoint will get an `application/json` POST request, containing the following structure in the body:

{%highlight js%}
{
  matchId: string, // unique ID for each match
  mapWidth: int, 
  mapHeight: int, 
  suddenDeath: int, // number of turns left until sudden death starts
  wallDamage: int, // how much damage does it cause to run into a wall
  tankDamage: int, // how much damage does it cause to run into a tank -- also, how much damage your tank causes when it runs into a wall
  weaponDamage: int, // how much damage does it cause to hit something with a bullet
  visibility: int, // how far, in fields, you can see on your radar 
  weaponRange: int, // how far, in fields, you can hit with a bullet 
  you: TANK, // your tank info -- see the tank structure below
  enemies: [TANK], // array. enemy tank info. see the tank structure below
  walls: [WALL], // array. visible walls. see the wall structure below
  fireFields: [FIELD] // array, visible fields caught by fire
};
{%endhighlight%}

### Coordinate space

The map is a 0-based matrix, where [0,0] is the upper left corner. The map width and height are in the `mapWidth` and `mapHeight` keys of the request body.

### Enemy tanks

The information on enemy tanks will be in the `enemies` key of the map your command endpoint receives, and your tank will be in the `you` key. You can see full tank info for yourself and tanks in your visibility zone. You can only see a summary for far-away tanks.

#### Summary format (outside your radar zone)

{%highlight js%}
{ strength: int }
{%endhighlight %}

#### Full info (your tank, enemies on your radar)

{%highlight js%}
{ 
  x: int, 
  y: int, 
  strength: int, 
  direction: string, /* 'left', 'right', 'top', 'bottom' */
  ammo: int,
  status: string
}
{%endhighlight %}

### Walls

Bumping into a wall causes damage. You can only see walls in your visibility zone:

{%highlight js%}
{ 
  x: int, 
  y: int, 
  strength: int 
}
{%endhighlight %}

*Note*: trying to move outside the map space will cause damage equal to wall damage. Border walls (around the entire map) are not in this list, but assume that anything outside [0,0] -> [mapWidth, mapHeight] is a wall.

### Fire fields

Staying in fire causes damage. You can only see fire fields in your visibility zone. During sudden death, fire expands quickly.

{%highlight js%}
{ 
  x: int, 
  y: int
}

{%endhighlight %}

## Example request {#example-request}

{%highlight json%}
{
  "matchId": "d191f1cc-c179-4779-b649-af5e9dab198e",
  "mapWidth": 30,
  "mapHeight": 10,
  "wallDamage": 30,
  "tankDamage": 50,
  "weaponDamage": 60,
  "visibility": 5,
  "weaponRange": 5,
  "you": {
    "direction": "top",
    "x": 29,
    "y": 8,
    "strength": 300,
    "ammo": 995,
    "status": "firing",
    "targetRange": 4
  },
  "enemies": [
    {
      "direction": "bottom",
      "x": 29,
      "y": 4,
      "strength": 240,
      "ammo": 1000,
      "status": "hit"
    }
  ],
  "walls": [
    {
      "x": 26,
      "y": 7,
      "strength": 200
    },
    {
      "x": 28,
      "y": 7,
      "strength": 200
    },
    {
      "x": 27,
      "y": 7,
      "strength": 200
    },
    {
      "x": 25,
      "y": 7,
      "strength": 200
    }
  ],
  "suddenDeath": 10,
  "fireFields": []
}
{%endhighlight %}

# Example response {#example-response}

{%highlight json%}
{
  "command": "fire"
}
{%endhighlight %}
