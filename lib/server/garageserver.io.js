var garageServerGame = require('./garageservergame');

/*
options = {
    onUpdatePhysics: function (state, input),
    physicsInterval: 15,
    playersInterval: 45,
    logging: true,
    onPlayerConnect: function (socket),
    onPlayerInput: function (socket, input),
    onPlayerDisconnect: function (socket),
    onPing: function (socket, data),
}
*/

function GarageServer (socketio, options) {
    this.io = socketio;
    this.game = new garageServerGame.createGame(options);
    this.registerSocketEvents(options);
}

GarageServer.prototype.registerSocketEvents = function (options) {
    var self = this;
    
    self.io.of('/garageserver.io').on('connection', function (socket) {
        if (options.logging) {
            console.log('garageserver.io:: socket ' + socket.id + ' connection');
        }
        self.onPlayerConnect(socket, options);

        socket.on('disconnect', function () {
            if (options.logging) {
                console.log('garageserver.io:: socket ' + socket.id + ' disconnect');
            }
            self.onPlayerDisconnect(socket, options);
        });

        socket.on('input', function (data) {
            if (options.logging) {
                console.log('garageserver.io:: socket input ' +  socket.id + ' ' + data.input + ' ' + data.seq);
            }
            self.onPlayerInput(socket, data, options);
        });

        socket.on('ping', function (data) {
            if (options.logging) {
                console.log('garageserver.io:: socket ping');
            }
            self.onPing(socket, data, options);
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
    this.game.removePlayer(socket);
    socket.broadcast.emit('removePlayer', socket.id);
    if (options.onPlayerDisconnect) {
        options.onPlayerDisconnect(socket);
    }
};

GarageServer.prototype.onPlayerInput = function (socket, input, options) {
    this.game.addPlayerInput(socket, input);
    if(options.onPlayerInput) {
        options.onPlayerInput(socket, input);
    }
};

GarageServer.prototype.onPing = function(socket, data, options) {
    socket.emit('ping', data);
    if (options.onPing) {
        options.onPing(socket, data);
    }
};

exports.createGarageServer = function (io, options){
    return new GarageServer(io, options); 
};