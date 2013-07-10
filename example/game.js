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
            smoothingFactor: this.physicsDelta * 20,
            onUpdatePlayerPhysics: gamePhysics.onUpdatePlayerPhysics,
            onUpdateEntityPhysics: gamePhysics.onUpdateEntityPhysics
        });
}

Game.prototype.start = function () {
    var self = this;
    this.physicsIntervalId = setInterval(function () { self.update(); }, this.physicsInterval);
    this.server.start();
};

Game.prototype.update = function () {
    var players = this.server.getPlayers(),
        self = this;
    
    players.forEach(function (player) {
        var newState = gamePhysics.getNewState(player.state, player.inputs, self.physicsDelta);
        self.server.updatePlayerState(player.id, newState);
    });
};