## GarageServer.IO Client API

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
options.onUpdateClientPredictionReady(callback(playerId, playerCurrentState, entityCurrentStates: [, {id, state}], inputs, deltaTime))  
```
If using client side prediction, this callback will fire when you should update player and entity states, based on the current states for player and entities, inputs to be processed, and the delta time.  

`callback` **function**  
Function to be invoked upon event firing.  

`playerId` **string**  
The id of the player. 

`playerCurrentState` **object literal**  
The current state of the player.  

`entityCurrentStates` **array**  
The list of all entities and their current state that were invoked by the player.

`inputs` **array**  
List of all the inputs to be processed.  

`deltaTime` **number**  
The amount, in milliseconds, between physics processing.  

---
```js
options.onInterpolation(callback(previousState, targetState, amount) : newState)  
```
**_Returns:_ object literal**  

If using interpolation, this callback should return the new state, `newState`, based on the previous state, target state, and percent between frames.  

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

#### updatePlayerState
---
```js
GarageServerIO.updatePlayerState(id, state)
```
Notify the GarageServer.IO client of the new player state - this is intended to be used with client side prediction.

`id` **string**  
The id of the player.  
`state` **object literal**  
Object containing all properties specific to the new player state in your game.

#### addEntity
---
```js
GarageServerIO.addEntity(id, state)
```
Notify the GarageServer.IO client of a new entity with an initial state - this is intended to be used with client side prediction.

`id` **string**  
The id of the entity.  
`state` **object literal**  
Object containing all properties specific to new entity state in your game.

#### updateEntityState
---
```js
GarageServerIO.updateEntityState(id, state)
```
Notify the GarageServer.IO client of the new entity state - this is intended to be used with client side prediction.

`id` **string**  
The id of the entity.  
`state` **object literal**  
Object containing all properties specific to the new entity state in your game.

#### removeEntity
---
```js
GarageServerIO.removeEntity(id)
```
Notify the GarageServer.IO client that an entity has been removed from the game - this is intended to be used with client side prediction.

`id` **string**  
The id of the entity.

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