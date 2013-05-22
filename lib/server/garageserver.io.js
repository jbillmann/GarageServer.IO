var garageServerGame = require('./garageservergame');

function GarageServer (socketio, options) {
    this.io = socketio;
    this.registerSocketEvents(options);
    this.game = new garageServerGame.createGame(options);
}

GarageServer.prototype.registerSocketEvents = function (options) {
    var self = this;
    
    self.io.of('/garageserver.io').on('connection', function (socket) {
        console.log('garageserver.io:: socket ' + socket.id + ' connection');
        self.onPlayerConnect(socket, options);
        
        socket.on('disconnect', function () {
            console.log('garageserver.io:: socket ' + socket.id + ' disconnect');
            self.onPlayerDisconnect(socket, options);
        });
        
        socket.on('input', function (input) {
            self.onPlayerInput(socket, options);
        });
        
        socket.on('ping', function () {
            self.onPlayerInput(socket, options);
        });
        
    });
};

GarageServer.prototype.onPlayerConnect = function (socket, callback) {
    this.game.addPlayer(socket);
    if(callback.onPlayerConnect) {
        callback(socket);
    }
};

GarageServer.prototype.onPlayerDisconnect = function (socket, callback) {
    this.game.removePlayer(socket);
    if(callback.onPlayerDisconnect) {
        callback(socket);
    }
};

GarageServer.prototype.onPlayerInput = function (socket, input, callback) {
    
};

GarageServer.prototype.onPing = function(socket, callback) {

};

exports.createGarageServer = function (io, options){
    return new GarageServer(io, options); 
};