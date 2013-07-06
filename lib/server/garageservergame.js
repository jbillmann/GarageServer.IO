var PlayerController = require('./controllers/playercontroller'),
    EntityController = require('./controllers/entitycontroller');

exports = module.exports = GarageServerGame;

function GarageServerGame(options) {
    var self = this;

    this.playerController = new PlayerController();
    this.entityController = new EntityController();
    this.options = options;
    this.startTime = new Date().getTime();
    this.physicsInterval = options.physicsInterval ? options.physicsInterval : 15;
    this.stateInterval = options.stateInterval ? options.stateInterval : 45;
    this.physicsDelta = this.physicsInterval / 1000;
    this.physicsIntervalId = setInterval(function () { self.updatePhysics(options); }, this.physicsInterval);
    this.stateIntervalId = setInterval(function () { self.updateState(options); }, this.stateInterval);
}

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

GarageServerGame.prototype.updatePhysics = function (options) {
    var self = this;
    this.playerController.entities.forEach(function (player) {
        if (player.inputs.length > 0) {
            if (options.onUpdatePlayerPhysics) {
                player.addState(options.onUpdatePlayerPhysics(player.client.id, player.state, player.inputs, self.physicsDelta), player.inputs[player.inputs.length - 1].time);
                player.sequence += player.inputs.length;
                player.inputs = [];
            }
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