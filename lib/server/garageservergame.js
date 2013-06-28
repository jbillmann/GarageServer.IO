function GarageServerGame(options) {
    var self = this;

    this.players = [];
    this.entities = [];
    this.options = options;
    this.startTime = new Date().getTime();
    this.physicsInterval = options.physicsInterval ? options.physicsInterval : 15;
    this.stateInterval = options.stateInterval ? options.stateInterval : 45;

    this.physicsIntervalId = setInterval(function () { self.updatePhysics(options); }, this.physicsInterval);
    this.stateIntervalId = setInterval(function () { self.updateState(options); }, this.stateInterval);
}

GarageServerGame.prototype.updateState = function (options) {
    this.updatePlayers(options);
    this.updateEntities(options);
};

GarageServerGame.prototype.updatePlayers = function (options) {
    var currentTime = new Date().getTime() - this.startTime,
        state = { time: currentTime, delta: this.physicsInterval, playerStates: [] };

    this.players.forEach(function (player) {
        state.playerStates.push({ id: player.client.id, state: player.state, seq: player.sequence });
    });

    this.players.forEach(function (player) {
        player.client.emit('update', state);
    });
};

GarageServerGame.prototype.updateEntities = function (options) {
    
};

GarageServerGame.prototype.updatePhysics = function (options) {
    this.players.forEach(function (player) {
        if (player.inputs.length > 0) {
            if (options.onUpdatePlayerPhysics) {
                player.state = options.onUpdatePlayerPhysics(player.state, player.inputs);
            }
            player.sequence += player.inputs.length;
            player.inputs = [];
        }
    });
};

GarageServerGame.prototype.addPlayer = function (client) {
    this.players.forEach(function (player) {
        if (player.client.id === client.id) {
            return;
        }
    });

    // Set player state callback
    var player = {
        client: client,
        state: {x: 0, y: 0},
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
    this.players.forEach(function (player) {
        if (player.client.id === client.id) {
            player.state = state;
            player.sequence += 1;
            player.inputs = [];
        }
        return;
    });
};

GarageServerGame.prototype.addPlayerInput = function (client, input) {
    this.players.forEach(function (player) {
        if (player.client.id === client.id) {
            player.inputs.push(input);
            return;
        }
    });
};

exports.createGame = function (options){
    return new GarageServerGame(options); 
};