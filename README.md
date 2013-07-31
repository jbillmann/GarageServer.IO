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

---
```js
options.onPlayerDisconnect(callback)  
```
If client disconnects from the server, this event will fire.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.onPlayerReconnect(callback)  
```
If client disconnects and reconnects to the server, this event will fire.  
`callback` **function**  
Function to be invoked upon event firing.  

---
```js
options.onPlayerUpdate(callback(state))  
```
Event fired each time `state` has been received to the client for a player.  
`callback` **function**  
Function to be invoked upon event firing.  
`state` **object literal**  
Object containing all of the properties pertaining to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

---
```js
options.onEntityUpdate(callback(state))  
```
Event fired each time `state` has been received to the client for an entity.  
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties pertaining to an entity for your game - x, y, z, time, etc., whatever you want to add to it.  

---
```js
options.onPlayerRemove(callback(id))  
```
Event fired when a player has been removed from GarageServer.IO.  
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the player who has been removed from GarageServer.IO.  

---
```js
options.onEntityRemove(callback(id))  
```
Event fired when an entity has been removed from GarageServer.IO.  
`callback` **function**  
Function to be invoked upon event firing.  

`id` **string**  
Id of the entity who has been removed from GarageServer.IO.  

---
```js
options.onEvent(callback(data))  
```
Event fired for custom event calling.  
`callback` **function**  
Function to be invoked upon event firing.  

`data` **object literal**  
Object containing all of the properties pertaining to a custom event for your game - a, b, c, etc., whatever you want to add to it.  

---
```js
options.onWorldState(callback(state))  
```
Event fired once world state has been received to the client from the server.  
`callback` **function**  
Function to be invoked upon event firing.  

`state` **object literal**  
Object containing all of the properties pertaining to world state for your game - f, u, n, etc., whatever you want to add to it.  

---
```js
options.onPing(callback(pingDelay))  
```
Event fired upon receiving ping delay on the client - determined by the 'pingInterval' option from the server.  
`callback` **function**  
Function to be invoked upon event firing.  

`pingDelay` **number**  
The current ping in milliseconds.  

---
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

---
```js
options.onInterpolation(callback(previousState, targetState, amount) : newState)  
```
If using interpolation, this callback should return the new state, based on the previous state, target state, and percent between.  
**_Returns:_ object literal**  

`callback` **function**  
Function to be invoked upon event firing.  

`previousState` **object literal**  
Object containing all of the properties pertaining to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

`targetState` **object literal**  
Object containing all of the properties pertaining to a player for your game - x, y, z, time, etc., whatever you want to add to it.  

`amount` **number**  
The "rough" percentage between frames to be used in conjuction with interpolation - client side smoothing is considered during the calculation of this number.  

---
```js
options.onReady(callback)
```
Event fired once client has succesfully connected to the server and received the world state.  
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
Notify the server of client inputs.  These will be used to determine state from the physics processing.  
`input` **object literal**  
This can be anything as it pertains to your game - 1, 'left', 'right', etc., whatever you want to make it.
#### getPlayerStates
---
```js
GarageServerIO.getPlayerStates() : [, {id, state}]
```
Returns a list of current player states from the most recent broadcast depending on interpolation settings.  
**_Returns:_ array**  

`id` **string**  
The id of the player.  
`state` **object literal**  
Object containing all properties pertaining to an entity state in your game.  
#### getEntityStates
---
```js
GarageServerIO.getEntityStates() : [, {id, state}]
```
Returns a list of current entity states from the most recent broadcast depending on interpolation settings.  
**_Returns:_ array**  

`id` **string**  
The id of the entity.  
`state` **object literal**  
Object containing all properties pertaining to an entity state in your game.  
#### getId
---
```js
GarageServerIO.getId() : playerid
```
Gets the id of the client's player.  
**_Returns:_ string**  

`playerid` **string**  
Id of the client's player.  
#### sendServerEvent
---
```js
GarageServerIO.sendServerEvent(data)
```
Send a custom event to the server.  
`data` **object literal**  
Object containing all properties pertaining to the custom event.  
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
Enable console logging of all the events occuring within the GarageServer.IO server.  
---
```js
options.clientSidePrediction
```
**boolean**  
Enables client side prediction and callback on the client.  
---
```js
options.interpolation
```
**boolean**  
Enables interpolation and callback on the client.  
---
```js
options.interpolationDelay
```
**number**  
The amount, in milliseconds, that state is rendered to the client behind actual server time.  
---
```js
options.smoothingFactor
```
**number**  

---
```js
options.pingInterval
```
**number**  
The amount, in milliseconds, that a ping is made to the server to test for latency.  
---
```js
options.maxUpdateBuffer
```
**number**  
The maximum amount of broadcasted state updates to store on the client for each player and entity.  
---
```js
options.maxHistorySecondBuffer
```
**number**  
The amount, in milliseconds, that a ping is made to the server to test for latency.  
---
```js
options.worldState
```
**object literal**  
Object containing all of the properties pertaining to world state for your game - f, u, n, etc., whatever you want to add to it.  
---
```js
options.onPlayerConnect(callback(socket))
```
Event fired when a player connects to the server.  
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**

---
```js
options.onPlayerInput(callback(socket, input))
```
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

`input` **object literal**  

---
```js
options.onPlayerDisconnect(callback(socket))
```
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

---
```js
options.onPing(callback(socket, data))
```
`callback` **function**  
Function to be invoked upon event firing.  
`socket` **Socket**  

`data` **number**  
The client start time when the ping was initiated.  
---
```js
options.onEvent(callback(data))
```
`callback` **function**  
Function to be invoked upon event firing.  
`data` **object literal**  
Object containing all properties pertaining to the custom event.  
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
