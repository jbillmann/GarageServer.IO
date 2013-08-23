var entity = require('./entity');

exports = module.exports = Player;

function Player (socket, maxHistorySecondBuffer) {
    entity.call(this, socket.id, maxHistorySecondBuffer);
    this.socket = socket;
    this.inputs = [];
}

Player.prototype = Object.create(entity.prototype);

Player.prototype.setRegion = function (region) {
    this.socket.join(region);
    this.socket.leave(this.region);
    this.region = region;
};

Player.prototype.addState = function (state, executionTime) {
    this.addHistory(state, executionTime);
    this.sequence += this.inputs.length;
    this.inputs = [];
};