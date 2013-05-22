function GarageServerGame (options) {
    this.players = [];
    
    this.physicsIntervalId = setInterval(this.updatePhysics, options.physicsInterval ? options.physicsInterval : 15);
    this.playersIntervalId = setInterval(this.updatePlayers, options.playersInterval ? options.playersInterval : 45);
}

GarageServerGame.prototype.updatePlayers = function () {
    
};

GarageServerGame.prototype.updatePhysics = function () {
    
};

GarageServerGame.prototype.addPlayer = function (client) {
    for(var i = 0; i < this.players.length; i ++) {
        if(this.players[i].id === client.id) {
            return;
        }
    }
    
    var player = {
        client: client,
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