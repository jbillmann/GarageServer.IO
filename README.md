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
`path`  
**Type:** string
The URL that points to where GarageServer.IO is running at on the server.
`options`  
**Type:** object literal
Configure the different options, events, callbacks that you would like to consume on the client.
```js
options.onPlayerConnect(callback)  
```
Once the client has made a connection to the server, this event will fire.
**callback**  
Type: function
```js
options.onPlayerDisconnect(callback)  
```
If client has has disconnected from the server, this event will fire.
**callback**  
Type: function
```js
options.onPlayerReconnect(callback)  
```
If client has has disconnects and reconnects to the server, this event will fire.
**callback**  
Type: function
```js
options.onPlayerUpdate(callback(state))  
```

**callback**  
Type: function

**state**  
Type: object literal

```js
options.onEntityUpdate(callback(state))  
```

**callback**  
Type: function

**state**  
Type: object literal

```js
options.onPlayerRemove(callback(id))  
```

**callback**  
Type: function

**id**  
Type: string

```js
options.onEntityRemove(callback(id))  
```

**callback**  
Type: function

**id**  
Type: string

```js
options.onEvent(callback(data))  
```

**callback**  
Type: function

**data**  
Type: object literal

```js
options.onWorldState(callback(state))  
```

**callback**  
Type: function

**state**  
Type: object literal

```js
options.onPing(callback(pingDelay))  
```

**callback**  
Type: function

**pingDelay**  
Type: number

```js
options.onUpdatePlayerPrediction(callback(state, inputs, deltaTime) : newState)  
```

**_Returns:_** object literal

**callback**  
Type: function

**state**  
Type: object literal

**inputs**  
Type: array

**deltaTime**  
Type: number

```js
options.onInterpolation(callback(previousState, targetState, amount) : newState)  
```

**_Returns:_** object literal

**callback**  
Type: function

**previousState**  
Type: object literal

**targetState**  
Type: object literal

**amount**  
Type: number

```js
options.onReady(callback)  
```

**callback**  
Type: function

```js
options.logging: true  
```

**logging**  
Type: boolean

#### addInput
---
```js
GarageServerIO.addInput(input)
```

**input**  
Type: object literal

#### getPlayerStates
---
```js
GarageServerIO.getPlayerStates() : [, {id, state}]
```

**_Returns:_** array

**id**  
Type: string

**state**  
Type: object literal

#### getEntityStates
---
```js
GarageServerIO.getEntityStates() : [, {id, state}]
```

**_Returns:_** array

**id**  
Type: string

**state**  
Type: object literal

#### getId
---
```js
GarageServerIO.getId() : playerid
```

**_Returns:_** string

**playerid**  
Type: string

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
```

**io**  
Type: Socket.IO instance

**options**  
Type: object literal

```js
options.stateInterval
```

Type: number

```js
options.logging
```

Type: boolean

```js
options.clientSidePrediction
```

Type: boolean

```js
options.interpolation
```

Type: boolean

```js
options.interpolationDelay
```

Type: number

```js
options.smoothingFactor
```

Type: number

```js
options.pingInterval
```

Type: number

```js
options.maxUpdateBuffer
```

Type: number

```js
options.maxHistorySecondBuffer
```

Type: number

```js
options.worldState
```

Type: object literal

```js
options.onPlayerConnect(callback(socket))
```

**callback**  
Type: function

**socket**  
Type: Socket

```js
options.onPlayerInput(callback(socket, input))
```

**callback**  
Type: function

**socket**  
Type: Socket

**input**  
Type: object literal

```js
options.onPlayerDisconnect(callback(socket))
```

**callback**  
Type: function

**socket**  
Type: Socket

```js
options.onPing(callback(socket, data))
```

**callback**  
Type: function

**socket**  
Type: Socket

**data**  
Type: object literal

```js
options.onEvent(callback(data))
```

**callback**  
Type: function

**data**  
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
GarageServerIO.getPlayers() : [, {id, state, [, inputs], [, {states, executionTimes}]}]
```

**_Returns:_** array

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
GarageServerIO.getEntities() : [,{id, state, [, {state, executionTime }]}]
```

**_Returns:_** array

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
