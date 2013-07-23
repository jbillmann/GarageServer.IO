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

### Client


### Server

## API

### Client

```js
GarageServerIO.initializeGarageServer(path, options)

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
    onUpdatePlayerPhysics(callback(state, inputs, deltaTime)),
    onInterpolation(callback(previousState, targetState, amount)) : newState,
    onReady(callback),
    logging: true
}
```

```js
GarageServerIO.addInput(input)
```

```js
GarageServerIO.getStates(callback([player1State, player2State, ...], [entity1State, entity2State, ...]))
```

```js
GarageServerIO.getId() : playerid
```

```js
GarageServerIO.sendServerEvent(data)
```

### Server

```js
require('.garageserver.io').createGarageServer(io, options) : GarageServerIO

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
```

```js
GarageServerIO.start()
```

```js
GarageServerIO.stop()
```

```js
GarageServerIO.getPlayers() : [{ id, state, [input1, input2,...], [{ state1, executionTime1 }, { state2, executionTime2 }, ...] }]
```

```js
GarageServerIO.getEntities() : [{ id, state, [{ state1, executionTime1 }, { state2, executionTime2 }, ...] }]
```

```js
GarageServerIO.updatePlayerState(id, state)
```

```js
GarageServerIO.updateEntityState(id, state)
```

```js
GarageServerIO.addEntity(id)
```

```js
GarageServerIO.removeEntity(id)
```

```js
GarageServerIO.sendPlayerEvent(id, data)
```

```js
GarageServerIO.sendPlayersEvent(data)
```

## Resources


## License

[MIT License](https://github.com/jbillmann/GarageServer.IO/blob/master/LICENSE.md)
