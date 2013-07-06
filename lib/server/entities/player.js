var Entity = require('./entity');

exports = module.exports = Player;

function Player (client) {
    Entity.call(this, client.id);
    this.client = client;
    this.inputs = [];
}

Player.prototype = Object.create(Entity.prototype);