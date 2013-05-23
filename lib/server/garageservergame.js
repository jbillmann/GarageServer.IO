function GarageServerGame (options) {
    var self = this;
    
    this.players = [];
    
    this.physicsIntervalId = setInterval(function () { self.updatePhysics(options); }, options.physicsInterval ? options.physicsInterval : 15);
    this.playersIntervalId = setInterval(function () { self.updatePlayers(options); }, options.playersInterval ? options.playersInterval : 45);
}

GarageServerGame.prototype.updatePlayers = function (options) {
    for(var i = 0; i < this.players.length; i ++) {
    }
};

GarageServerGame.prototype.updatePhysics = function (options) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].inputs.length > 0) {
            if(options.onUpdatePhysics) {
                this.players[i].state = options.onUpdatePhysics(this.players[i].state, this.players[i].inputs);
            }
            this.players[i].inputs = [];
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
        inputs: []
    };
    
    this.players.push(player);
};

GarageServerGame.prototype.removePlayer = function (client) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].id === client.id) {
            this.players.splice(i, 1)[0];
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

exports.createGame = function (options){
    return new GarageServerGame(options); 
};