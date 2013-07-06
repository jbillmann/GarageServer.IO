var PlayerController = require('./controllers/playercontroller');

exports = module.exports = GarageServerGame;

function GarageServerGame(options) {
    var self = this;

    this.players = [];
    this.entities = [];
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

    state.playerStates = this.updatePlayers();
    state.entityStates = this.updateEntities();

    this.players.forEach(function (player) {
        player.client.emit('update', state);
    });
};

GarageServerGame.prototype.updatePlayers = function () {
    var states = [];

    this.players.forEach(function (player) {
        states.push([ player.client.id, player.state, player.sequence ]);
    });

    return states;
};

GarageServerGame.prototype.updateEntities = function () {
    var states = [];

    this.entities.forEach(function (entity) {
        states.push([ entity.id, entity.state, entity.sequence ]);
    });

    return states;
};

GarageServerGame.prototype.updatePhysics = function (options) {
    var self = this;
    this.players.forEach(function (player) {
        if (player.inputs.length > 0) {
            if (options.onUpdatePlayerPhysics) {
                player.state = options.onUpdatePlayerPhysics(player.client.id, player.state, player.inputs, self.physicsDelta);
            }
            player.sequence += player.inputs.length;
            player.inputs = [];
        }
    });
};

GarageServerGame.prototype.addPlayer = function (client) {
    this.players.some(function (player) {
        if (player.client.id === client.id) {
            return true;
        }
    });

    var player = {
        client: client,
        state: {},
        inputs: [],
        sequence: 1
    };

    this.players.push(player);
};

GarageServerGame.prototype.removePlayer = function (client) {
    for (var i = 0; i < this.players.length; i ++) {
        if (this.players[i].client.id === client.id) {
            this.players.splice(i, 1)[0];
            return;
        }
    }
};

GarageServerGame.prototype.setPlayerState = function (client, state) {
    this.players.some(function (player) {
        if (player.client.id === client.id) {
            player.state = state;
            player.inputs = [];
            return true;
        }
    });
};

GarageServerGame.prototype.addPlayerInput = function (client, input) {
    this.players.some(function (player) {
        if (player.client.id === client.id) {
            player.inputs.push({ input: input[0], seq: input[1], time: input[2] });
            return true;
        }
    });
};