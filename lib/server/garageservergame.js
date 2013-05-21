function GarageServerGame (options) {
    
    this.physicsIntervalId = setInterval(this.updatePhysics, options.physicsInterval ? options.physicsInterval : 15);
    this.playersIntervalId = setInterval(this.updatePlayers, options.playersInterval ? options.playersInterval : 45);
}

GarageServerGame.prototype.updatePlayers = function () {
    
};

GarageServerGame.prototype.updatePhysics = function () {
    
};

exports.createGame = function (options){
    return new GarageServerGame(options); 
};