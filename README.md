# GarageServer.IO
A simple, lightweight, HTML multiplayer game server (and client) for Node.js

## Features
- Authoritative Game Server
- Client Side / Input Prediciton
- Client Side Smoothing
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
**3.** Inside physics loop, process inputs for players, process entites and update states.  Note that state is an object literal effectively offering up any grab bag of properties that are specific to your game's state.
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
**2.** Inside physics loop, capture and send input via GarageServer.IO.  Similar to state, input offers up any grab bag of properties specific to your game's input.
```js
GarageServerIO.addInput(myInput);
```
**3.** Inside render loop, extract player and entity states - this will retrieve the current states based on your interpolation, prediction and smoothing settings.  Players are effectively clients whereas entities are determined by players inputs and controlled by the server.  
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
Invoked once the player has made a connection to the server.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.onPlayerDisconnect(callback)  
```
Invoked if a player disconnects from the server.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.onPlayerReconnect(callback)  
```
Invoked if a player disconnects and then reconnects to the server.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.onPlayerUpdate(callback(state))  
```
Invoked each time `state` has been received to the player for a player.  
`callback` **function**  
Function to be invoked upon event firing.  
`state` **object literal**  
Object containing all of the properties specific to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

---
```js
options.onEntityUpdate(callback(state))  
```
Invoked each time `state` has been received to the client for an entity.  
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties specific to an entity for your game - x, y, z, time, etc., whatever you want to add to it.  

---
```js
options.onPlayerRemove(callback(id))  
```
Invoked when a player has been removed from GarageServer.IO.  
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the player who has been removed from GarageServer.IO.  

---
```js
options.onEntityRemove(callback(id))  
```
Invoked when an entity has been removed from GarageServer.IO.  
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the entity who has been removed from GarageServer.IO.  

---
```js
options.onEvent(callback(data))  
```
Invoked when a custom event is received.  Custom events are merely funneled thru GarageServer.IO - acts simply as a transport to and from the server and client(s).  
`callback` **function**  
Function to be invoked upon event firing.  

`data` **object literal**  
Object containing all of the properties specific to a custom event for your game - a, b, c, etc., whatever you want to add to it.  

---
```js
options.onWorldState(callback(state))  
```
Invoked once world state has been received to the client from the server.  
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties specific to world state for your game - height, width, start, etc., whatever you want to add to it.  

---
```js
options.onPing(callback(pingDelay))  
```
Invoked upon receiving a ping delay on the client - determined by the 'pingInterval' option from the server.  
`callback` **function**  
Function to be invoked upon event firing.  

`pingDelay` **number**  
The current ping in milliseconds.  

---
```js
options.onUpdatePlayerPrediction(callback(currentState, inputs, deltaTime) : newState)  
```
**_Returns:_ object literal**  

If using client side prediction, this callback should return the new state based on the current state, inputs to be processed, and the delta time.  

`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
The current state of the player.  

`inputs` **array**  
List of all the inputs to be processed.  

`deltaTime` **number**  
The amount, in milliseconds, between physics processing.  

---
```js
options.onInterpolation(callback(previousState, targetState, amount) : newState)  
```
**_Returns:_ object literal**  

If using interpolation, this callback should return the new state, based on the previous state, target state, and percent between frames.  

`callback` **function**  
Function to be invoked upon event firing.  

`previousState` **object literal**  
Object containing all of the properties specific to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

`targetState` **object literal**  
Object containing all of the properties specific to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

`amount` **number**  
The "rough" percentage between frames to be used in conjuction with interpolation - the server `options.smoothing` is considered during the calculation of this number.  

---
```js
options.onReady(callback)
```
Invoked once a client has succesfully connected to the server and received the world state.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.logging
```
Enables console logging of all the events occuring within the GarageServer.IO client.  
`logging` **boolean**  

#### addInput
---
```js
GarageServerIO.addInput(input)
```
Notify the server of client inputs.  Inputs are transferred to the server and subsequently used to determine the new player state from the physics processing.  The idea here is that this call is made during each pass of the physics loop on the client.  
`input` **object literal**  
This can be anything as it pertains to your game - 1, 'left', 'right', etc., whatever you want to make it.
#### getPlayerStates
---
```js
GarageServerIO.getPlayerStates() : [, {id, state}]
```
**_Returns:_ array**  

Returns a list of current player states from the most recent broadcast depending on interpolation settings.  

`id` **string**  
The id of the player.  
`state` **object literal**  
Object containing all properties specific to player state in your game.  
#### getEntityStates
---
```js
GarageServerIO.getEntityStates() : [, {id, state}]
```
**_Returns:_ array**  

Returns a list of current entity states from the most recent broadcast depending on interpolation settings.  

`id` **string**  
The id of the entity.  
`state` **object literal**  
Object containing all properties specific to entity state in your game.  
#### getId
---
```js
GarageServerIO.getId() : playerid
```
Gets the id of the client.  Recall, clients are effectively players.  
**_Returns:_ string**  

`playerid` **string**  
Id of the client's player.  
#### sendServerEvent
---
```js
GarageServerIO.sendServerEvent(data)
```
Send a custom event to the server.  Use this to make custom calls to GarageServer.IO for your game.  
`data` **object literal**  
Object containing all properties specific to the custom event.  
### Server

#### createGarageServer
---
```js
require('garageserver.io').createGarageServer(io, options) : GarageServerIO
```
Returns a new instance of GarageServer.IO, registers Socket.IO events and instantiates an instance of a game that handles the broadcasting of state.  
`io` **Socket.IO instance**  

`options` **object literal**  
Configure the different options, events, callbacks that you would like to consume on the server.  
#### Server Options
---
```js
options.stateInterval  
```
**number**  
The amount, in milliseconds, that state is broadcasted to clients.  

---
```js
options.logging
```
**boolean**  
Enables console logging of all the events occuring within the GarageServer.IO server.  Defaults to `false`.  

---
```js
options.clientSidePrediction
```
**boolean**  
Enables client side prediction and callback on the client.  Defaults to `false`.  

---
```js
options.interpolation
```
**boolean**  
Enables interpolation and callback on the client.  Defaults to `false`.  

---
```js
options.interpolationDelay
```
**number**  
The amount, in milliseconds, that state is rendered to the client behind actual server time.  Defaults to `100`.  

---
```js
options.smoothingFactor
```
**number**  
Defaults to `0.3`.  

---
```js
options.pingInterval
```
**number**  
The amount, in milliseconds, that a ping is made to the server to test for latency.  Defaults to `2000`.  

---
```js
options.maxUpdateBuffer
```
**number**  
The maximum amount of broadcasted state updates to store on the client for each player and entity.  Defaults to `120`.  

---
```js
options.maxHistorySecondBuffer
```
**number**  
The amount, in milliseconds, that history is stored for a player and/or entity.  Defaults to `1000`.  

---
```js
options.worldState
```
**object literal**  
Object containing all of the properties specific to world state for your game - f, u, n, etc., whatever you want to add to it.  

---
```js
options.onPlayerConnect(callback(socket))
```
Invoked when a player (client) connects to the server.  
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**

---
```js
options.onPlayerInput(callback(socket, input))
```
Invoked when a player (client) submits input to the server.  
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

`input` **object literal**  

---
```js
options.onPlayerDisconnect(callback(socket))
```
Invoked when a player (client) disconnects from the server.  
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

---
```js
options.onPing(callback(socket, data))
```
Invoked when a client pings the server.  
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

`data` **number**  
The client start time when the ping was initiated.  

---
```js
options.onEvent(callback(data))
```
Invoked when a client emits a custom event.  
`callback` **function**  
Function to be invoked upon event firing.  
`data` **object literal**  
Object containing all properties specific to the custom event.  
#### start
---
```js
GarageServerIO.start()
```
Starts the server time and broadcast loop.
#### stop
---
```js
GarageServerIO.stop()
```
Stops the server time and broadcast loop.
#### getPlayers
---
```js
GarageServerIO.getPlayers() : [, {id, state, [, inputs], [, {states, executionTimes}]}]
```
**_Returns:_ array**  

Returns a list of all players, their current states, inputs to be processed, and a list of their prior states and times limited by the server `options.maxHistorySecondBuffer`.  

`id` **string**  
Id of the player.  
`state` **object literal**  
Current state of the player.  
`inputs` **array of object literals**  
List of all the inputs received for this player that need to be processed.  
`stateHistory` **array of object literals**  
List of all previous states and their execution times up to `options.maxHistorySecondBuffer`.
#### getEntities
---
```js
GarageServerIO.getEntities() : [,{id, state, [, {state, executionTime }]}]
```
**_Returns:_ array**

Returns a list of all entities, their current states, and a list of their prior states and times limited by the server `options.maxHistorySecondBuffer`.  

`id` **string**  
Id of the entity.  
`state` **object literal**  
Current state of the entity.  
`stateHistory` **array of object literals**  
List of all previous states and their execution times up to `options.maxHistorySecondBuffer`.
#### updatePlayerState
---
```js
GarageServerIO.updatePlayerState(id, state)
```

Notify GargeServer.IO of a new state with an id of the player to be updated.  The idea here is that this call is made during each pass of the physics loop on the server.   

`id` **string**  
Id of the player whose state should be updated.  
`state` **object literal**  
New state of the entity containing all of the properties specific to a player for your game - x, y, z, time, etc., whatever you want to add to it.  
#### updateEntityState
---
```js
GarageServerIO.updateEntityState(id, state)
```

Notify GargeServer.IO of a new state with an id of the entity to be updated.  The idea here is that this call is made during each pass of the physics loop on the server.  

`id` **string**  
Id of the entity whose state should be updated.  
`state` **object literal**  
New state of the entity containing all of the properties specific to an entity for your game - x, y, z, time, etc., whatever you want to add to it.  
#### addEntity
---
```js
GarageServerIO.addEntity(id)
```

Notify GarageServer.IO that a new entity has been added to the game.  

`id` **string**  
Id of the entity to be added.  
#### removeEntity
---
```js
GarageServerIO.removeEntity(id)
```

Notify GarageServer.IO that an entity has been removed from the game.  

`id` **string**  
Id of the entity to be removed.  
#### sendPlayerEvent
---
```js
GarageServerIO.sendPlayerEvent(id, data)
```
Allows server to broadcast events to a specific player.  Use this to make custom calls to a GarageServer.IO client for your game.  
`id` **string**  
Id of the player to receive event.  
`data` **object literal**  
Object containing all properties specific to the custom event.  
#### sendPlayersEvent
---
```js
GarageServerIO.sendPlayersEvent(data)
```
Allows server to broadcast events to all players.  Use this to make custom calls to GarageServer.IO clients for your game.  
`data` **object literal**  
Object containing all properties specific to the custom event.

## License

[MIT License](https://github.com/jbillmann/GarageServer.IO/blob/master/LICENSE.md)
