var garageServerGame = require('./garageservergame');

function GarageServer (socketio, options) {
    this.io = socketio;
    this.registerSocketEvents(options);
    this.game = new garageServerGame.createGame(options);
}

GarageServer.prototype.registerSocketEvents = function (options) {
    this.io.of('/garageserver.io').on('connection', function (socket) {
        this.onPlayerConnect(socket, options.onConnection);
    }.bind(this));
    
    this.io.of('/garageserver.io').on('disconnect', function (socket) {
        this.onPlayerDisconnect(socket, options.onDisconnect);
    }.bind(this));
    
     this.io.of('/garageserver.io').on('input', function (socket) {
        this.onPlayerInput(socket, options.onInput);
    }.bind(this));
};

GarageServer.prototype.onPlayerConnect = function (socket, callback) {

};

GarageServer.prototype.onPlayerDisconnect = function (socket, callback) {
};

GarageServer.prototype.onPlayerInput = function (socket, callback) {
};

exports.createGarageServer = function (io, options){
    return new GarageServer(io, options); 
};