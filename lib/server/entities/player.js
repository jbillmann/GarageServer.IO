var Entity = require('./entity');

exports = module.exports = Player;

function Player () {
    Entity.call(this);
}

Player.prototype = Object.create(Entity.prototype);