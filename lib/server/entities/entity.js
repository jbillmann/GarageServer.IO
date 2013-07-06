exports = module.exports = Entity;

function Entity (id) {
    this.state;
    this.sequence = 1;
    this.id = id;
    this.stateHistory = [];
}

Entity.prototype = {
    addState: function (state, executionTime) {
        var minTime, spliceTo = 0;
        this.stateHistory.push({ state: state, executionTime: executionTime });
        minTime = this.stateHistory[this.stateHistory.length - 1].executionTime - 1000;

        for (var i = 0; i < this.stateHistory.length; i ++) {
            if (this.stateHistory[i].executionTime > minTime) {
                spliceTo = i - 1;
                break;
            }
        }
        if (spliceTo > 0) {
            this.stateHistory.splice(0, spliceTo);
        }
    }
};