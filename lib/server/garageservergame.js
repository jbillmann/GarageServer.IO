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
        state = { time: currentTime, delta: this.physicsInterval, playerStates: [] },
        i = 0;

    for (i = 0; i < this.players.length; i ++) {
        state.playerStates.push({ id: this.players[i].client.id, state: this.players[i].state, seq: this.players[i].sequence });
    }

    for (i = 0; i < this.players.length; i ++) {
        this.players[i].client.emit('update', state);
    }
};

GarageServerGame.prototype.updateEntities = function (options) {
    
};

GarageServerGame.prototype.updatePhysics = function (options) {
    for (var i = 0; i < this.players.length; i ++) {
        if (this.players[i].inputs.length > 0) {
            if (this.options.onUpdatePlayerPhysics) {
                this.players[i].state = this.options.onUpdatePlayerPhysics(this.players[i].state, this.players[i].inputs);
            }
            this.players[i].sequence += this.players[i].inputs.length;
            this.players[i].inputs = [];
        }
    }
};

GarageServerGame.prototype.addPlayer = function (client) {
    for (var i = 0; i < this.players.length; i ++) {
        if (this.players[i].client.id === client.id) {
            return;
        }
    }

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
    for (var i = 0; i < this.players.length; i ++) {
        if (this.players[i].client.id === client.id) {
            this.players[i].state = state;
            this.players[i].sequence += 1;
            this.players[i].inputs = [];
        }
    }
};

GarageServerGame.prototype.addPlayerInput = function (client, input) {
    for (var i = 0; i < this.players.length; i ++) {
        if (this.players[i].client.id === client.id) {
            this.players[i].inputs.push(input);
            return;
        }
    }
};

exports.createGame = function (options){
    return new GarageServerGame(options); 
};