var playerController = require('./controllers/playercontroller'),
    entityController = require('./controllers/entitycontroller');

exports = module.exports = GarageServerGame;

function GarageServerGame(options, broadcastCallback) {
    this.options = options;
    this.startTime = 0;
    this.stateInterval = options.stateInterval ? options.stateInterval : 45;
    this.stateIntervalId = 0;
    this.playerController = new playerController(this.options.maxHistorySecondBuffer ? this.options.maxHistorySecondBuffer : 1000);
    this.entityController = new entityController(this.options.maxHistorySecondBuffer ? this.options.maxHistorySecondBuffer : 1000);
    this.broadcastCallback = broadcastCallback;
    this.regions = [];
}

GarageServerGame.prototype.start = function () {
    var self = this;

    this.startTime = new Date().getTime();
    this.stateIntervalId = setInterval(function () { self.broadcastState(); }, this.stateInterval);
};

GarageServerGame.prototype.stop = function () {
    clearInterval(this.stateIntervalId);
};

GarageServerGame.prototype.broadcastState = function () {
    var i = 0, currentTime = new Date().getTime() - this.startTime,
        state = { t: currentTime, ps: [], es: [] };

    if (this.regions.length > 0) {
        for (i = 0; i < this.regions.length; i ++) {
            state.ps = this.getStateByRegion(this.playerController, this.regions[i]);
            state.es = this.getStateByRegion(this.entityController, this.regions[i]);
            this.broadcastCallback(state, this.regions[i]);
        }
    } else {
        state.ps = this.getState(this.playerController);
        state.es = this.getState(this.entityController);
        this.broadcastCallback(state);
    }
};

GarageServerGame.prototype.getState = function (controller) {
    var states = [];
    controller.entities.forEach(function (entity) {
        states.push([ entity.id, entity.state, entity.sequence ]);
    });
    return states;
};

GarageServerGame.prototype.getStateByRegion = function (controller, region) {
    var states = [];
    controller.entities.forEach(function (entity) {
        if (entity.region === region) {
            states.push([ entity.id, entity.state, entity.sequence ]);
        }
    });
    return states;
};

GarageServerGame.prototype.getPlayers = function () {
    var list = [];
    this.playerController.entities.forEach(function (player) {
        list.push({ id: player.id, state: player.state, inputs: player.inputs, stateHistory: player.stateHistory });
    });
    return list;
};

GarageServerGame.prototype.getEntities = function () {
    var list = [];
    this.entityController.entities.forEach(function (entity) {
        list.push({ id: entity.id, state: entity.state, stateHistory: entity.stateHistory });
    });
    return list;
};

GarageServerGame.prototype.updatePlayerState = function (id, state) {
    this.updateState(this.playerController, id, state);
};

GarageServerGame.prototype.updateEntityState = function (id, state) {
    this.updateState(this.entityController, id, state);
};

GarageServerGame.prototype.updateState = function (controller, id, state) {
    var currentTime = new Date().getTime() - this.startTime;

    controller.entities.some(function (entity) {
        if (entity.id === id) {
            entity.addState(state, currentTime);
            return true;
        }
    });
};

GarageServerGame.prototype.addPlayer = function (socket) {
    this.playerController.add(socket);
};

GarageServerGame.prototype.removePlayer = function (id) {
    this.playerController.remove(id);
};

GarageServerGame.prototype.addEntity = function (id) {
    this.entityController.add(id);
};

GarageServerGame.prototype.removeEntity = function (id) {
    this.entityController.remove(id);
};

GarageServerGame.prototype.addPlayerInput = function (id, input, sequence, time) {
    this.playerController.addInput(id, input, sequence, time);
};

GarageServerGame.prototype.sendPlayerEvent = function (id, data) {
    this.playerController.entities.some(function (player) {
        if (player.id === id) {
            player.socket.emit('e', data);
            return true;
        }
    });
};

GarageServerGame.prototype.setPlayerRegion = function (id, region) {
    this.setRegion(this.playerController, id, region);
};

GarageServerGame.prototype.setEntityRegion = function (id, region) {
    this.setRegion(this.entityController, id, region);
};

GarageServerGame.prototype.setRegion = function (controller, id, region) {
    var self = this;
    controller.entities.some(function (entity) {
        if (entity.id === id) {
            entity.setRegion(region);
            self.updateRegions(region);
            return true;
        }
    });
};

GarageServerGame.prototype.updateRegions = function (region) {
    var regionFound = false;

    this.regions.forEach(function (item) {
        if (item === region) {
            regionFound = true;
        }
    });
    if (!regionFound) {
        this.regions.push(region);
    }
};

GarageServerGame.prototype.clearRegions = function () {
    this.regions = [];
    this.entityController.clearRegions();
    this.playerController.clearRegions();
};