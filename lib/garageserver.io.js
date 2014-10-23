var garageServerGame = require('./garageservergame');

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
api methods
    createGarageServer(io, options)
    start()
    stop()
    getPlayers() : [,{ id, state, [,inputs], [,{ states, executionTimes }] }]
    getEntities() :[,{ id, state, [,{ state, executionTime }] }]
    updatePlayerState(id, state)
    updateEntityState(id, state)
    addEntity(id)
    removeEntity(id)
    sendPlayerEvent(id, data)
    sendPlayersEvent(data)
*/
function GarageServer(socketio, options) {
    var namespace = '/garageserver.io';

    this.socketPath = namespace;
    this.io = socketio;
    this.registerSocketEvents(options);
    this.game = new garageServerGame(options, function (state, region) {
        if (!region) {
            socketio.of(namespace).emit('u' ,state);
        } else {
            socketio.of(namespace).in(region).emit('u' ,state);
        }
    });
}

GarageServer.prototype.registerSocketEvents = function (options) {
    var self = this;

    self.io.of(self.socketPath).on('connection', function (socket) {
        if (options.logging) {
            console.log('garageserver.io:: socket ' + socket.id + ' connection');
        }
        socket.emit('s', {
            physicsDelta: (options.physicsInterval ? options.physicsInterval : 15) / 1000,
            smoothingFactor: options.smoothingFactor ? options.smoothingFactor : 0.3,
            interpolation: options.interpolation ? options.interpolation : false,
            interpolationDelay: options.interpolationDelay ? options.interpolationDelay : 100,
            pingInterval: options.pingInterval ? options.pingInterval : 2000,
            clientSidePrediction: options.clientSidePrediction ? options.clientSidePrediction : false,
            maxUpdateBuffer: options.maxUpdateBuffer ? options.maxUpdateBuffer : 120,
            worldState: options.worldState ? options.worldState : {}
        });
        self.onPlayerConnect(socket, options);

        socket.on('disconnect', function () {
            if (options.logging) {
                console.log('garageserver.io:: socket ' + socket.id + ' disconnect');
            }
            self.onPlayerDisconnect(socket, options);
        });

        socket.on('i', function (data) {
            if (options.logging) {
                console.log('garageserver.io:: socket input ' +  socket.id + ' ' + data[0] + ' ' + data[1]);
            }
            self.onPlayerInput(socket, data, options);
        });

        socket.on('p', function (data) {
            if (options.logging) {
                console.log('garageserver.io:: socket ping ' + data);
            }
            self.onPing(socket, data, options);
        });

        socket.on('e', function (data) {
            if (options.logging) {
                console.log('garageserver.io:: event ' + data);
            }
            if (options.OnEvent) {
                options.OnEvent(data);
            }
        });
    });
};

GarageServer.prototype.onPlayerConnect = function (socket, options) {
    this.game.addPlayer(socket);
    if (options.onPlayerConnect) {
        options.onPlayerConnect(socket);
    }
};

GarageServer.prototype.onPlayerDisconnect = function (socket, options) {
    this.game.removePlayer(socket.id);
    socket.broadcast.emit('rp', socket.id);
    if (options.onPlayerDisconnect) {
        options.onPlayerDisconnect(socket);
    }
};

GarageServer.prototype.onPlayerInput = function (socket, input, options) {
    this.game.addPlayerInput(socket.id, input[0], input[1], input[2]);
    if (options.onPlayerInput) {
        options.onPlayerInput(socket, input);
    }
};

GarageServer.prototype.onPing = function (socket, data, options) {
    socket.emit('p', data);
    if (options.onPing) {
        options.onPing(socket, data);
    }
};

GarageServer.prototype.start = function () {
    this.game.start();
};

GarageServer.prototype.stop = function () {
    this.game.stop();
};

GarageServer.prototype.getPlayers = function () {
    return this.game.getPlayers();
};

GarageServer.prototype.getEntities = function () {
    return this.game.getEntities();
};

GarageServer.prototype.updatePlayerState = function (id, state) {
    this.game.updatePlayerState(id, state);
};

GarageServer.prototype.updateEntityState = function (id, state) {
    this.game.updateEntityState(id, state);
};

GarageServer.prototype.addEntity = function (id) {
    this.game.addEntity(id);
};

GarageServer.prototype.removeEntity = function (id) {
    this.io.of(this.socketPath).emit('re', id);
    this.game.removeEntity(id);
};

GarageServer.prototype.sendPlayerEvent = function (id, data) {
    this.game.sendPlayerEvent(id, data);
};

GarageServer.prototype.sendPlayersEvent = function (data) {
    this.io.of(this.socketPath).emit('e', data);
};

GarageServer.prototype.setPlayerRegion = function (id, region) {
    this.game.setPlayerRegion(id, region);
};

GarageServer.prototype.setEntityRegion = function (id, region) {
    this.game.setEntityRegion(id, region);
};

GarageServer.prototype.clearRegions = function () {
    this.game.clearRegions();
};

exports.createGarageServer = function (io, options) {
    return new GarageServer(io, options);
};