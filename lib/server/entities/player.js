var Entity = require('./entity');

exports = module.exports = Player;

function Player (client) {
    Entity.call(this);
    this.client = client;
    this.id = client.id;
    this.inputs = [];
}

Player.prototype = Object.create(Entity.prototype);