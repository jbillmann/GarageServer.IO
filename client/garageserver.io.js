/*
options = {
    onPlayerConnect: function()
    onPlayerDisconnect: function (),
    onPlayerReconnect: function (),
    onPlayerUpdate: function (state),
    onEntityUpdate: function (state),
    onPlayerRemove: function (id),
    onGameState: function (state),
    onPing: function (pingDelay),
    onUpdatePlayerPhysics: function (id, state, inputs, deltaTime),
    onUpdate: function (),
    onInterpolation: function(id, previousState, targetState, amount)
    logging: true
}
*/

window.GarageServerIO = (function (window, socketio) {

    function StateController() {
        this.state = {};
        this.clientTime;
        this.renderTime;
        this.physicsDelta;
        this.physicsIntervalId;
        this.currentTime;
        this.accumulator = 0.0;
        this.playerId;
        this.pingDelay = 100;
        this.interpolationDelay = 100;
        this.interpolation = false;
        this.pingInterval = 2000;
        this.clientSidePrediction = false;
        this.smoothingFactor = 1;
    }
    StateController.prototype = {
        setTime: function (serverTime) {
            this.clientTime = serverTime;
            this.renderTime = this.clientTime - this.interpolationDelay;
        },
        accumulate: function () {
            var newTime = new Date().getTime(),
                frameTime = newTime - this.currentTime;
            if (frameTime  > 250) {
                frameTime = 250;
            }
            this.currentTime = newTime;
            this.accumulator += frameTime;
        }
    };

    function Input(input, seq) {
        this.input = input;
        this.seq = seq;
    }

    function InputController() {
        this.inputs = [];
        this.sequenceNumber = 1;
    }
    InputController.prototype = {
        any: function () {
            return this.inputs.length > 0;
        },
        add: function (input) {
            this.sequenceNumber += 1;
            this.inputs.push(new Input(input, this.sequenceNumber));
        },
        remove: function (seq) {
            for (var i = 0; i < this.inputs.length; i ++) {
                if (this.inputs[i].seq === seq) {
                    this.inputs.splice(0, i + 1);
                    break;
                }
            }
        }
    };

    function Update(state, seq, time) {
        this.state = state;
        this.seq = seq;
        this.time = time;
    }

    function Entity(id) {
        this.updates = [];
        this.id = id;
        this.currentState = {};
    }
    Entity.prototype = {
        addUpate: function (state, seq, time) {
            var newUpdate = new Update(state, seq, time);
            if (this.updates.length === 0) {
                this.currentState = newUpdate.state;
            }
            this.updates.push(newUpdate);
            if (this.updates.length > 120) {
                this.updates.splice(0, 1);
            }
        },
        updateState: function (state, seq, time) {
            var updateFound = false;
            this.updates.some(function (update) {
               if (update.seq === seq) {
                   update.state = state;
                   updateFound = true;
                   return true;
               } 
            });
            if (!updateFound) {
                this.addUpate(state, seq, time);
            }
        },
        anyUpdates: function () {
            return this.updates.length > 0;
        },
        latestUpdate: function () {
            return this.updates[this.updates.length - 1];
        },
        surroundingPositions: function (time) {
            var positions = {};
            for (var i = 0; i < this.updates.length; i ++) {
                var previous = this.updates[i],
                    target = this.updates[i + 1];

                if (previous && target && time > previous.time && time < target.time) {
                    positions.previous = previous;
                    positions.target = target;
                    break;
                }
            }
            return positions;
        }
    };

    function Player(id) {
        Entity.call(this, id);
    }
    Player.prototype = Object.create(Entity.prototype);

    function EntityController() {
        this.entities = [];
    }

    function PlayerController() {
        EntityController.call(this);
    }
    PlayerController.prototype = {
        add: function (id) {
            var player = new Player(id);
            this.entities.push(player);
            return player;
        },
        remove: function (id) {
            for (var i = 0; i < this.entities.length; i ++) {
                this.entities.splice(i, 1);
                return;
            }
        }
    };

    var _io = socketio,
        _socket = null,
        _options = null,
        _stateController = new StateController(),
        _inputController = new InputController(),
        _playerController = new PlayerController(),
        _entityController = new EntityController(),

        initializeGarageServer = function (path, opts) {
            _options = opts;
            _socket = _io.connect(path + '/garageserver.io');
            registerSocketEvents();
        },

        registerSocketEvents = function () {
            _socket.on('connect', function () {
                _stateController.playerId = _socket.id;
                if (_options.onPlayerConnect) {
                    _options.onPlayerConnect(); 
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket connect');
                }
            });
            _socket.on('state', function (data) {
                if (_options.onGameState) {
                    _options.onGameState(data); 
                }
                _stateController.physicsDelta = data.physicsDelta;
                _stateController.interpolation = data.interpolation;
                _stateController.interpolationDelay = data.interpolationDelay;
                _stateController.pingInterval = data.pingInterval;
                _stateController.clientSidePrediction = data.clientSidePrediction;
                _stateController.smoothingFactor = data.smoothingFactor;
                setInterval(function (){
                    _socket.emit('ping', new Date().getTime());
                }, _stateController.pingInterval);
            });
            _socket.on('disconnect', function () {
                if (_options.onPlayerDisconnect) {
                    _options.onPlayerDisconnect();
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket disconnect');
                }
            });
            _socket.on('reconnect', function () {
                if (_options.onPlayerReconnect) {
                    _options.onPlayerReconnect();
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket reconnect');
                }
            });
            _socket.on('update', function (data) {
                updateState(data);
            });
            _socket.on('ping', function (data) {
                _stateController.pingDelay = new Date().getTime() - data;
                if (_options.onPing) {
                    _options.onPing(_stateController.pingDelay);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _stateController.pingDelay);
                }
            });
            _socket.on('removePlayer', function (id) {
                removePlayer(id);
                if (_options.onPlayerRemove) {
                    _options.onPlayerRemove(id);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
            });
        },

        start = function () {
            var self = this;
            _stateController.currentTime = new Date().getTime();
            _stateController.physicsIntervalId = setInterval(function () { self.update(); }, this.physicsDelta * 1000);
        },

        getPlayerId = function () {
            return _stateController.playerId;
        },

        setPlayerState = function (state) {
            _socket.emit('playerState', state);
        },

        removePlayer = function (id) {
            _playerController.remove(id);
        },

        update = function () {
            if (_options.onUpdate) {
                _stateController.accumulate();
                while (_stateController.accumulator >= (_stateController.physicsDelta * 1000))
                {
                    _options.onUpdate();
                    _stateController.accumulator -= (_stateController.physicsDelta * 1000);
                }
            }
        },

        addPlayerInput = function (clientInput) {
            _inputController.add(clientInput);
            if (_stateController.clientSidePrediction && _options.onUpdatePlayerPhysics) {
                _stateController.state = _options.onUpdatePlayerPhysics(_stateController.playerId, _stateController.state, [{ input: clientInput }], _stateController.physicsDelta);
            }
            _socket.emit('input', [ clientInput, _inputController.sequenceNumber, _stateController.renderTime ]);
        },

        updateState = function (data) {
            _stateController.setTime(data.time);

            updatePlayersState(data);
            updateEntitiesState(data);
        },

        updatePlayersState = function (data) {
            data.playerStates.forEach(function (playerState) {
                if (_socket.socket.sessionid === playerState[0]) {
                    updatePlayerState(playerState);
                } else {
                    updateOtherPlayersState(playerState, data.time);
                }

                if (_options.onPlayerUpdate) {
                    _options.onPlayerUpdate(playerState[1]);
                }
            });
        },

        updatePlayerState = function (playerState) {
            _stateController.state = playerState[1];
            _inputController.remove(playerState[2]);

            if (_stateController.clientSidePrediction && _inputController.any()) {
                _stateController.state = _options.onUpdatePlayerPhysics(_stateController.playerId, _stateController.state, _inputController.inputs, _stateController.physicsDelta);
            }
        },

        updateOtherPlayersState = function (playerState, time) {
            updateEntityState(_playerController, playerState, time);
        },

        updateEntitiesState = function (data) {
            data.entityStates.forEach(function (entityState) {
                updateEntityState(_entityController, entityState, data.time);

                if (_options.onEntityUpdate) {
                    _options.onEntityUpdate(entityState[1]);
                }
            });
        },

        updateEntityState = function (entityController, entityState, time) {
            var entityFound = false;
            entityController.entities.some(function (entity) {
                if (entity.id === entityState[0]) {
                    entityFound = true;
                    entity.updateState(entityState[1], entityState[2], time);
                    return true;
                }
            });
            if (!entityFound) {
                var newEntity = entityController.add(entityState[0]);
                newEntity.addUpate(entityState[1], entityState[2], time);
            }
        },

        getStates = function (stateCallback) {
            if (_stateController.interpolation && _options.onInterpolation) {
                getEntityStatesInterpolated(_entityController);
                getEntityStatesInterpolated(_playerController);
            }
            else {
                getEntityStatesCurrent(_entityController);
                getEntityStatesCurrent(_playerController);
            }
            stateCallback(_stateController.state, _playerController.entities, _entityController.entities);
        },

        getEntityStatesCurrent = function (entityController) {
            entityController.entities.forEach(function (entity) {
                if (entity.anyUpdates()) {
                    entity.currentState = entity.latestUpdate().state;
                }
            });
        },

        getEntityStatesInterpolated = function (entityController) {
            var positions, amount, newState;
            entityController.entities.forEach(function (entity) {
                if (entity.anyUpdates()) {
                    positions = entity.surroundingPositions(_stateController.renderTime);
                    if (positions.previous && positions.target) {
                        amount = getInterpolatedAmount(positions.previous.time, positions.target.time);
                        newState = _options.onInterpolation(entity.id, positions.previous.state, positions.target.state, amount);
                        entity.currentState = newState = _options.onInterpolation(entity.id, entity.currentState, newState, _stateController.smoothingFactor);
                    }
                }
            });
        },

        getInterpolatedAmount = function (previousTime, targetTime) {
            var range = targetTime - previousTime,
                difference = _stateController.renderTime - previousTime,
                amount = parseFloat((difference / range).toFixed(3));

            return amount;
        };

    return {
        initializeGarageServer: initializeGarageServer,
        start: start,
        update: update,
        addPlayerInput: addPlayerInput,
        getStates: getStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState
    };

}) (window, io);