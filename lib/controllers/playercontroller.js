var entityController = require('./entitycontroller'),
    player = require('../entities/player');

exports = module.exports = PlayerController;

function PlayerController (maxHistorySecondBuffer) {
    entityController.call(this, maxHistorySecondBuffer);
}

PlayerController.prototype = Object.create(entityController.prototype);

PlayerController.prototype.add = function (socket) {
    var newPlayer, playerFound = false;

    this.entities.some(function (player) {
        if (player.id === socket.id) {
            newPlayer = player;
            playerFound = true;
            return true;
        }
    });

    if (!playerFound) {
        newPlayer = new player(socket, this.maxHistorySecondBuffer);
        this.entities.push(newPlayer);
    }
    return newPlayer;
};

PlayerController.prototype.addInput = function (id, input, sequence, time) {
    this.entities.some(function (player) {
        if (player.id === id) {
            player.inputs.push({ input: input, seq: sequence, time: time });
            return true;
        }
    });
};