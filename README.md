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

### Server

**1.** Create instance of GarageServer.IO - pass in a Socket.IO instance and GarageServer.IO options
```js
var garageServer = require('garageserver.io'),

var server = garageServer.createGarageServer(sockets, 
    {
        interpolation: true,
        clientSidePrediction: true,
        worldState: { width: '400px', height: '400px'; }
    });
```
**2.** Start GarageServer.IO instance prior to starting physics loop
```js
server.start();
```
**3.** Inside physics loop, process inputs for players, process entites and update states
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
            newState.x -= (50 * deltaTime);
        } else if (inputs[i].input === 'right') {
            newState.x += (50 * deltaTime);
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

**1.** Initialize GarageServer.IO
```js
GarageServerIO.initializeGarageServer('http://insertmygameurlhere.com', {
    onReady: function () {
        // Call your game loop
    },
    onUpdatePlayerPrediction: function (state, inputs, deltaTime) {
        // If using client prediction, process over inputs using current state and deltaTime and return new state
    },
    onInterpolation: function (previousState, targetState, amount) {
        // If interpolating, return new state using the previous state, target state, and the amount of progress towards the latter
    },
    onWorldState: function (state) {
        // Extract world state sent from server
    }
};
```
**2.** Inside physics loop, capture and send input via GarageServer.IO
```js
GarageServerIO.addInput(myInput);
```
**3.** Inside render loop, extract player and entity states
```js
GarageServerIO.getStates(function (playerStates, entityStates) {
    playerStates.forEach(function (player) {
        ctxCanvas.fillRect(player.state.x, player.state.y, 5, 5);
    });

    entityStates.forEach(function (entity) {
        ctxCanvas.fillRect(entity.state.x, entity.state.y, 5, 5);
    });
});
```

## API

### Client

#### initializeGarageServer
---
```js
GarageServerIO.initializeGarageServer(path, options)
/*
options = {
    onPlayerConnect(callback),
    onPlayerDisconnect(callback),
    onPlayerReconnect(callback),
    onPlayerUpdate(callback(state)),
    onEntityUpdate(callback(state)),
    onPlayerRemove(callback(id)),
    onEntityRemove(callback(id)),
    onEvent(callback(data)),
    onWorldState(callback(state)),
    onPing(callback(pingDelay)),
    onUpdatePlayerPrediction(callback(state, inputs, deltaTime) : newState),
    onInterpolation(callback(previousState, targetState, amount) : newState),
    onReady(callback),
    logging: true
}
*/
```
**path**  
Type: string

**options**  
Type: object literal

#### addInput
---
```js
GarageServerIO.addInput(input)
```

**input**  
Type: object literal

#### getStates
---
```js
GarageServerIO.getStates(callback([, playerState], [, entityState]))
```

**callback**  
Type: function(playerStates, entityStates)

**playerStates**  
Type: array of object literals

**entityStates**  
Type: array of object literals

#### getId
---
```js
GarageServerIO.getId() : playerid
```

**playerid**  
Type: number

#### sendServerEvent
---
```js
GarageServerIO.sendServerEvent(data)
```

**data**  
Type: object literal

### Server

#### createGarageServer
---
```js
require('garageserver.io').createGarageServer(io, options) : GarageServerIO
/*
options = {
    stateInterval: 45,
    logging: true,
    clientSidePrediction: true,
    interpolation: true,
    interpolationDelay: 100,
    smoothingFactor: 0.3,
    pingInterval: 2000,
    maxUpdateBuffer: 120,
    maxHistorySecondBuffer: 1000,
    worldState: {},
    onPlayerConnect(callback(socket)),
    onPlayerInput(callback(socket, input)),
    onPlayerDisconnect(callback(socket)),
    onPing(callback(socket, data)),
    onEvent(callback(data))
}
*/
```

**io**  
Type: Socket.IO instance

**options**  
Type: object literal

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
GarageServerIO.getPlayers() : [,{ id, state, [,inputs], [,{ states, executionTimes }] }]
```

**id**  
Type: string

**state**  
Type: object literal

**inputs**  
Type: array of object literals

**stateHistory**  
Type: array of object literals

#### getEntities
---
```js
GarageServerIO.getEntities() : [,{ id, state, [,{ state, executionTime }] }]
```

**id**  
Type: string

**state**  
Type: object literal

**stateHistory**  
Type: array of object literals

#### updatePlayerState
---
```js
GarageServerIO.updatePlayerState(id, state)
```
**id**  
Type: string

**state**  
Type: object literal

#### updateEntityState
---
```js
GarageServerIO.updateEntityState(id, state)
```
**id**  
Type: string

**state**  
Type: object literal

#### addEntity
---
```js
GarageServerIO.addEntity(id)
```
**id**  
Type: string

#### removeEntity
---
```js
GarageServerIO.removeEntity(id)
```
**id**  
Type: string

#### sendPlayerEvent
---
```js
GarageServerIO.sendPlayerEvent(id, data)
```
**id**  
Type: string

**data**  
Type: object literal

#### sendPlayersEvent
---
```js
GarageServerIO.sendPlayersEvent(data)
```
**data**  
Type: object literal


## License

[MIT License](https://github.com/jbillmann/GarageServer.IO/blob/master/LICENSE.md)
