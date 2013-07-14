var entity = require('./entity');

exports = module.exports = Player;

function Player (client) {
    entity.call(this, client.id);
    this.client = client;
    this.inputs = [];
}

Player.prototype = Object.create(entity.prototype);

Player.prototype.addState = function (state, executionTime) {
    this.addHistory(state, executionTime);
    this.sequence += this.inputs.length;
    this.inputs = [];
};