var garageServer = require('../lib/garageserver.io'),
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
            smoothingFactor: 0.2
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
        var newState = gamePhysics.getNewPlayerState(player.id, player.state, player.inputs, self.physicsDelta, self.server);
        self.server.updatePlayerState(player.id, newState);
    });

    for (var i = entities.length - 1; i >= 0; i--) {
        var entity = entities[i],
            newState = gamePhysics.getNewEntityState(entity.state, self.physicsDelta);

        if (newState.x < -200 || newState.y < -200 || newState.x > 2000 || newState.y > 2000) {
            self.server.removeEntity(entity.id);
        } else {
            self.server.updateEntityState(entity.id, newState);
        }
    }
};