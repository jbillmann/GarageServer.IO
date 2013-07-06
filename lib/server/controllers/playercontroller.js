var EntityController = require('./entitycontroller'),
    Player = require('../entities/player');

exports = module.exports = PlayerController;

function PlayerController () {
    EntityController.call(this);
}

PlayerController.prototype = Object.create(EntityController.prototype);