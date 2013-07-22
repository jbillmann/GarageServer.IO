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
    onInterpolation(callback(previousState, targetState, amount)),
    onReady(callback,
    logging: true
}
```

```js
GarageServerIO.addInput(input)
```

```js
GarageServerIO.getStates(callback(playerStates: [player1State, player2State, ...], entityStates: [entity1State, entity2State, ...]))
```

```js
GarageServerIO.getId() : 'playerid'
```

```js
GarageServerIO.sendServerEvent(data)
```

### Server


## Resources


## License

[MIT License](https://github.com/jbillmann/GarageServer.IO/blob/master/LICENSE.md)
