var garageServer = require('../lib/server/garageserver.io'),
    gamePhysics = require('./shared/core');
    
exports = module.exports = Game;

function Game (sockets) {
    this.physicsInterval = 15;
    this.physicsDelta = this.physicsInterval / 1000;
    this.physicsIntervalId = 0;
    
    this.server = garageServer.createGarageServer(sockets, 
        {
            logging: true,
            interpolation: true,
            clientSidePrediction: true,
            onUpdatePlayerPhysics: gamePhysics.onUpdatePlayerPhysics,
            onUpdateEntityPhysics: gamePhysics.onUpdateEntityPhysics
        });
}

Game.prototype.start = function () {
    var self = this;
    this.server.start();
    this.physicsIntervalId = setInterval(function () { self.update(); }, this.physicsInterval);
};

Game.prototype.update = function () {
    
};