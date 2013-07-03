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
    this.updatePlayers(options);
    this.updateEntities(options);
};

GarageServerGame.prototype.updatePlayers = function (options) {
    var currentTime = new Date().getTime() - this.startTime,
        state = { time: currentTime, playerStates: [] };

    this.players.forEach(function (player) {
        state.playerStates.push([ player.client.id, player.state, player.sequence ]);
    });

    this.players.forEach(function (player) {
        player.client.emit('update', state);
    });
};

GarageServerGame.prototype.updateEntities = function (options) {
    
};

GarageServerGame.prototype.updatePhysics = function (options) {
    var self = this;
    this.players.forEach(function (player) {
        if (player.inputs.length > 0) {
            if (options.onUpdatePlayerPhysics) {
                player.state = options.onUpdatePlayerPhysics(player.state, player.inputs, self.physicsDelta);
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

exports.createGame = function (options){
    return new GarageServerGame(options); 
};