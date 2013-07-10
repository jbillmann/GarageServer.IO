var playerController = require('./controllers/playercontroller'),
    entityController = require('./controllers/entitycontroller');

exports = module.exports = GarageServerGame;

function GarageServerGame(options) {
    this.playerController = new playerController();
    this.entityController = new entityController();
    this.options = options;
    this.startTime;
    this.stateInterval = options.stateInterval ? options.stateInterval : 45;
    this.stateIntervalId = 0;
}

GarageServerGame.prototype.start = function () {
    var self = this;

    this.startTime = new Date().getTime();
    this.stateIntervalId = setInterval(function () { self.updateState(self.options); }, this.stateInterval);
};

GarageServerGame.prototype.updateState = function (options) {
    var currentTime = new Date().getTime() - this.startTime,
        state = { time: currentTime, playerStates: [], entityStates: [] };

    state.playerStates = this.getState(this.playerController);
    state.entityStates = this.getState(this.entityController);

    this.playerController.entities.forEach(function (player) {
        player.client.emit('update', state);
    });
};

GarageServerGame.prototype.getState = function (controller) {
    var states = [];
    controller.entities.forEach(function (entity) {
        states.push([ entity.id, entity.state, entity.sequence ]);
    });
    return states;
};

GarageServerGame.prototype.getPlayers = function () {
    return this.playerController.entities;
};

GarageServerGame.prototype.getPlayer = function (id) {
    var playerFound;

    this.playerController.entities.some(function (player) {
        if (player.id === id) {
            playerFound = player;
            return true;
        }
    });
    return playerFound;
};

GarageServerGame.prototype.updatePlayerState = function (id, state) {
     var currentTime = new Date().getTime() - this.startTime;

    this.playerController.entities.some(function (player) {
        if (player.id === id) {
            player.addState(state, currentTime);
            player.sequence += player.inputs.length;
            player.inputs = [];
            return true;
        }
    });
};

GarageServerGame.prototype.addPlayer = function (client) {
    this.playerController.add(client);
};

GarageServerGame.prototype.removePlayer = function (id) {
    this.playerController.remove(id);
};

GarageServerGame.prototype.setPlayerState = function (id, state) {
    this.playerController.setState(id, state);
};

GarageServerGame.prototype.addPlayerInput = function (id, input, sequence, time) {
    this.playerController.addInput(id, input, sequence, time);
};