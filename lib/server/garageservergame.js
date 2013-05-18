function GarageServerGame (options) {

}

GarageServerGame.prototype.update = function () {
    
};

exports.createGame = function (options){
    return new GarageServerGame(options); 
};