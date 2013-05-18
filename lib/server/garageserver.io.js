var garageServerGame = require('./garageservergame');

function GarageServer (socketio, options) {
    this.io = socketio;
    this.registerSocketEvents(this.io);
    this.game = new garageServerGame.createGame(options);
}

GarageServer.prototype.registerSocketEvents = function () {
    this.io.of('/garageserver.io').on('connection', function (socket) {
        this.onPlayerConnect(socket);
    }.bind(this));
    
    this.io.of('/garageserver.io').on('disconnect', function (socket) {
        this.onPlayerDisconnect(socket);
    }.bind(this));
    
     this.io.of('/garageserver.io').on('input', function (socket) {
        this.onPlayerInput(socket);
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