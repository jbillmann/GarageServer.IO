# GarageServer.IO
A simple, lightweight, HTML multiplayer game server (and client) for Node.js

## Features
- Authoritative Game Server
- Client Side / Input Prediciton
- Client Side Smooting
- Entity Interpolation
- Server State History
- Server and Client Messaging


## Quick Start

Create a quick game whereby players simply move squares along the x-axis.  I know, it's boring, but it keeps things simple and to the point.  For a more thorough demonstration of how GarageServer.IO works, look at the example included in the source code.

### Server

**1.** Create instance of GarageServer.IO - pass in a Socket.IO instance and GarageServer.IO options.
```js
var garageServer = require('garageserver.io'),

var server = garageServer.createGarageServer(sockets, 
    {
        interpolation: true,
        clientSidePrediction: true,
        worldState: { width: '400px', height: '400px'; }
    });
```
**2.** Start GarageServer.IO instance prior to starting physics loop.  This starts the clock that is used for broadcasting state and storing state history.
```js
server.start();
```
**3.** Inside physics loop, process inputs for players, process entites and update states.  Note that state is an object literal effectively offering up any grab bag of properties that pertain to your game's state.
```js
var players = server.getPlayers(),
    entities = server.getEntities();

players.forEach(function (player) {
    var newState = {};
    if (!player.state.x) {
       player.state.x = 0;
    }
    for (i = 0; i < player.inputs.length; i ++) {
        if (player.inputs[i].input === 'left') {
            newState.x = player.state.x - (50 * deltaTime);
        } else if (inputs[i].input === 'right') {
            newState.x = player.state.x + (50 * deltaTime);
        }
    }
    server.updatePlayerState(player.id, newState);
});
entities.forEach(function (entity) {
    // Calculate new state from entity.state and send GarageServer.IO new state
    server.updateEntityState(entity.id, newState);
});
```

### Client

**1.** Initialize GarageServer.IO.
```js
GarageServerIO.initializeGarageServer('http://insertmygameurlhere.com', {
    onReady: function () {
        // Call your game loop
    },
    onUpdatePlayerPrediction: function (state, inputs, deltaTime) {
        var newState = {};
        if (!player.state.x) {
        player.state.x = 0;
        }
        for (i = 0; i < player.inputs.length; i ++) {
            if (player.inputs[i].input === 'left') {
                newState.x = player.state.x - (50 * deltaTime);
            } else if (inputs[i].input === 'right') {
                newState.x = player.state.x + (50 * deltaTime);
            }
        }
        return newState;
    },
    onInterpolation: function (previousState, targetState, amount) {
        return { x: (previousState.x + amount * (targetState.x - previousState.x)) };
    },
    onWorldState: function (state) {
        document.getElementById('gameCanvas').style.width = state.width;
        document.getElementById('gameCanvas').style.height = state.height;
    }
};
```
**2.** Inside physics loop, capture and send input via GarageServer.IO.
```js
GarageServerIO.addInput(myInput);
```
**3.** Inside render loop, extract player and entity states.
```js
var playerStates = GarageServerIO.getPlayerStates(),
    entityStates = GarageServerIO.getEntityStates();  
    playerStates.forEach(function (player) {
        ctxCanvas.fillRect(player.state.x, 0, 5, 5);
    });
    entityStates.forEach(function (entity) {
        ctxCanvas.fillRect(entity.state.x, 0, 5, 5);
    });
```

## API

### Client

#### initializeGarageServer
---
```js
GarageServerIO.initializeGarageServer(path, options)
```
Establish connection to GarageServer.IO on the server via Socket.IO and register events.  
`path` **string**  
The URL that points to where GarageServer.IO is running at on the server.  
`options` **object literal**  
Configure the different options, events, callbacks that you would like to consume on the client.  
#### Client Options
---
```js
options.onPlayerConnect(callback)  
```
Once the client has made a connection to the server, this event will fire.  
`callback` **function**  
Function to be invoked upon event firing.  

```js
options.onPlayerDisconnect(callback)  
```
If client has has disconnected from the server, this event will fire.  
`callback` **function**  
Function to be invoked upon event firing.  

```js
options.onPlayerReconnect(callback)  
```
If client has has disconnects and reconnects to the server, this event will fire.  
`callback` **function**  
Function to be invoked upon event firing.  

```js
options.onPlayerUpdate(callback(state))  
```
Event fired each time state has been received to the client for a player.  
`callback` **function**  
Function to be invoked upon event firing.  
`state` **object literal**  
Object containing all of the properties pertaining to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

```js
options.onEntityUpdate(callback(state))  
```
Event fired each time state has been received to the client for an entity.  
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties pertaining to an entity for your game - x, y, z, time, etc., whatever you want to add to it.  

```js
options.onPlayerRemove(callback(id))  
Event fired when a player has been removed from GarageServer.IO.  
```
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the player who has been removed from GarageServer.IO  

```js
options.onEntityRemove(callback(id))  
```
Event fired when an entity has been removed from GarageServer.IO.  
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the entity who has been removed from GarageServer.IO  

```js
options.onEvent(callback(data))  
Event fired for custom event calling.  
```
`callback` **function**  
Function to be invoked upon event firing.  

`data` **object literal**  
Object containing all of the properties pertaining to a custom event for your game - a, b, c, etc., whatever you want to add to it.  

```js
options.onWorldState(callback(state))  
```
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties pertaining to world state for your game - f, u, n, etc., whatever you want to add to it.  

```js
options.onPing(callback(pingDelay))  
```
`callback` **function**  
Function to be invoked upon event firing.  

`pingDelay` **number**  
The current ping in milliseconds.  

```js
options.onUpdatePlayerPrediction(callback(state, inputs, deltaTime) : newState)  
```
If using client side prediction, this callback should return the new state based on the current state, inputs to be processed, and the delta time.  
**_Returns:_ object literal**  

`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
The current state of the player.  

`inputs` **array**  
List of all the inputs to be processed.  

`deltaTime` **number**  
The amount, in milliseconds, between physics processing.  

```js
options.onInterpolation(callback(previousState, targetState, amount) : newState)  
```
If using interpolation, this callback should return the new state, based on the previous state, target state, and percent between.  
**_Returns:_ object literal**  

`callback` **function**  
Function to be invoked upon event firing.  

`previousState` **object literal**  

`targetState` **object literal**  

`amount` **number**  

```js
options.onReady(callback)  
```
`callback` **function**  
Function to be invoked upon event firing.  

```js
options.logging: true  
```
`logging` **boolean**  

#### addInput
---
```js
GarageServerIO.addInput(input)
```
`input` **object literal**  

#### getPlayerStates
---
```js
GarageServerIO.getPlayerStates() : [, {id, state}]
```
**_Returns:_ array**  

`id` **string**  

`state` **object literal**  

#### getEntityStates
---
```js
GarageServerIO.getEntityStates() : [, {id, state}]
```
**_Returns:_ array**  

`id` **string**  

`state` **object literal**  

#### getId
---
```js
GarageServerIO.getId() : playerid
```
**_Returns:_ string**  

`playerid` **string**  

#### sendServerEvent
---
```js
GarageServerIO.sendServerEvent(data)
```
`data` **object literal**  

### Server

#### createGarageServer
---
```js
require('garageserver.io').createGarageServer(io, options) : GarageServerIO
```
`io` **Socket.IO instance**  

`options` **object literal**
#### Server Options
---
```js
options.stateInterval
```
**number**  

```js
options.logging
```
**boolean**  

```js
options.clientSidePrediction
```
**boolean**  

```js
options.interpolation
```
**boolean**  

```js
options.interpolationDelay
```
**number**  

```js
options.smoothingFactor
```
**number**  

```js
options.pingInterval
```
**number**  

```js
options.maxUpdateBuffer
```
**number**  

```js
options.maxHistorySecondBuffer
```
**number**  

```js
options.worldState
```
**object literal**  

```js
options.onPlayerConnect(callback(socket))
```
`callback` **function**  

`socket` **Socket**

```js
options.onPlayerInput(callback(socket, input))
```
`callback` **function**  

`socket` **Socket**  

`input` **object literal**  

```js
options.onPlayerDisconnect(callback(socket))
```
`callback` **function**  

`socket` **Socket**  

```js
options.onPing(callback(socket, data))
```
`callback` **function**  

`socket` **Socket**  

`data` **object literal**  

```js
options.onEvent(callback(data))
```
`callback` **function**  

`data` **object literal**  

#### start
---
```js
GarageServerIO.start()
```

#### stop
---
```js
GarageServerIO.stop()
```

#### getPlayers
---
```js
GarageServerIO.getPlayers() : [, {id, state, [, inputs], [, {states, executionTimes}]}]
```
**_Returns:_ array**  

`id` **string**  

`state` **object literal**  

`inputs` **array of object literals**  

`stateHistory` **array of object literals**  

#### getEntities
---
```js
GarageServerIO.getEntities() : [,{id, state, [, {state, executionTime }]}]
```
**_Returns:_ array**

`id` **string**  

`state` **object literal**  

`stateHistory` **array of object literals**  

#### updatePlayerState
---
```js
GarageServerIO.updatePlayerState(id, state)
```
`id` **string**  

`state` **object literal**  

#### updateEntityState
---
```js
GarageServerIO.updateEntityState(id, state)
```
`id` **string**  

`state` **object literal**  

#### addEntity
---
```js
GarageServerIO.addEntity(id)
```
`id` **string**  

#### removeEntity
---
```js
GarageServerIO.removeEntity(id)
```
`id` **string**  

#### sendPlayerEvent
---
```js
GarageServerIO.sendPlayerEvent(id, data)
```
`id` **string**  

`data` **object literal**  

#### sendPlayersEvent
---
```js
GarageServerIO.sendPlayersEvent(data)
```
`data` **object literal**  


## License

[MIT License](https://github.com/jbillmann/GarageServer.IO/blob/master/LICENSE.md)
