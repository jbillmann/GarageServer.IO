function GarageServer (io) {
    this.io = io;
}

GarageServer.prototype.PlayerConnect = function (callback) {
    this.io.sockets.on('connection', function (socket) {
        callback(socket);
    });
};

GarageServer.prototype.PlayerDisconnect = function (callback) {
    this.io.sockets.on('connection', function (socket) {
        callback(socket);
    });
};

exports.createGameServer = function (io, options){
    return new GarageServer(io); 
};