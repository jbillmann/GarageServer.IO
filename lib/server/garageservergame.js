function GarageServerGame (socketio, options) {
    var self = this;
    
    this.players = [];
    this.io = socketio;
    
    this.physicsIntervalId = setInterval(function () { self.updatePhysics(options); }, options.physicsInterval ? options.physicsInterval : 15);
    this.playersIntervalId = setInterval(function () { self.updatePlayers(options); }, options.playersInterval ? options.playersInterval : 45);
}

GarageServerGame.prototype.updatePlayers = function (options) {
    var currentTime = new Date().getTime();
    for(var i = 0; i < this.players.length; i ++) {
        this.io.emit('update', { id: this.players[i].client.id, state: this.players[i].state, seq: this.players[i].sequence, timestamp: currentTime });
    }
};

GarageServerGame.prototype.updatePhysics = function (options) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].inputs.length > 0) {
            if(options.onUpdatePhysics) {
                this.players[i].state = options.onUpdatePhysics(this.players[i].state, this.players[i].inputs);
            }
            this.players[i].inputs = [];
            this.players[i].sequence += this.players[i].inputs.length;
        }
    }
};

GarageServerGame.prototype.addPlayer = function (client) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].id === client.id) {
            return;
        }
    }
    
    var player = {
        client: client,
        state: {},
        inputs: [],
        sequence: 0
    };
    
    this.players.push(player);
};

GarageServerGame.prototype.removePlayer = function (client) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].id === client.id) {
            this.players.splice(i, 1)[0];
            return;
        }
    }
};

GarageServerGame.prototype.addPlayerInput = function (client, input) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].id === client.id) {
            this.players[i].inputs.push(input);
            return;
        }
    }
};

exports.createGame = function (socketio, options){
    return new GarageServerGame(socketio, options); 
};