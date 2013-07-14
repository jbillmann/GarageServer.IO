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
            worldState: { height: '400px', width: '800px' }
        });
}

Game.prototype.start = function () {
    var self = this;
    this.physicsIntervalId = setInterval(function () { self.update(); }, this.physicsInterval);
    this.server.start();
};

Game.prototype.update = function () {
    var players = this.server.getPlayers(),
        entities = this.server.getEntities(),
        self = this;

    players.forEach(function (player) {
        var newState = gamePhysics.getNewPlayerState(player.state, player.inputs, self.physicsDelta);
        self.server.updatePlayerState(player.id, newState);
    });

    entities.forEach(function (entity) {
        var newState = gamePhysics.getNewPlayerState(entity.state, self.physicsDelta);
        self.server.updateEntityState(entity.id, newState);
    });
};