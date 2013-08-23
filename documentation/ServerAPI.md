## GarageServer.IO Server API

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
#### setPlayerRegion
---
```js
GarageServerIO.setPlayerRegion(id, region)
```
Sets the player region.  GarageServer.IO will broadcast the state of players and entities who share the same region.  NOTE: This will implicitly enable GarageServer.IO region broadcasting - only those players and entities with regions with be notified of state.  Use `clearRegions` to revert region broadcasting.  
`id` **string**  
Id of the player to receive event.  
`region` **string**  
Name of the region.  
#### setEntityRegion
---
```js
GarageServerIO.setEntityRegion(id, region)
```
Sets the entity region.  GarageServer.IO will broadcast the state of players and entities who share the same region.  NOTE: This will implicitly enable GarageServer.IO region broadcasting - only those players and entities with regions with be notified of state.  Use `clearRegions` to revert region broadcasting.  
`id` **string**  
Id of the entity to receive event.  
`region` **string**  
Name of the region.  
#### clearRegions
---
```js
GarageServerIO.clearRegions()
```
Clears all regions associated with players and entities.  GarageServer.IO will default back to broadcasting state to all players.  