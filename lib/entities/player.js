var entity = require('./entity');

exports = module.exports = Player;

function Player (client, maxHistorySecondBuffer) {
    entity.call(this, client.id, maxHistorySecondBuffer);
    this.client = client;
    this.inputs = [];
}

Player.prototype = Object.create(entity.prototype);

Player.prototype.addState = function (state, executionTime) {
    this.addHistory(state, executionTime);
    this.sequence += this.inputs.length;
    this.inputs = [];
};