/*
options = {
    onPlayerConnect(callback),
    onPlayerDisconnect(callback),
    onPlayerReconnect(callback),
    onPlayerUpdate(callback(state)),
    onEntityUpdate(callback(state)),
    onPlayerRemove(callback(id)),
    onEntityRemove(callback(id)),
    onEvent(callback(data)),
    onWorldState(callback(state)),
    onPing(callback(pingDelay)),
    onUpdatePlayerPrediction(callback(currentState, inputs, deltaTime) : newState),
    onInterpolation(callback(previousState, targetState, amount) : newState),
    onReady(callback),
    logging: true
}
api methods
    initializeGarageServer(path, options)
    addInput(input)
    getPlayerStates : [, playerState]
    getEntityStates : [, entityState]
    getId() : playerid
    sendServerEvent(data)
*/
var GarageServerIO = (function (socketio) {

    "use strict";

    if (!socketio) {
        throw new Error("GarageServer.IO: Socket.IO not found. Please ensure socket.io.js is referenced before the garageserver.io.js file.");
    }

    function StateController() {
        this.clientTime = 0;
        this.renderTime = 0;
        this.physicsDelta = 0.0;
        this.id = '';
        this.pingDelay = 100;
        this.interpolationDelay = 100;
        this.interpolation = false;
        this.pingInterval = 2000;
        this.clientSidePrediction = false;
        this.smoothingFactor = 0.3;
        this.worldState = {};
    }
    StateController.prototype = {
        setTime: function (serverTime) {
            this.clientTime = serverTime;
            this.renderTime = this.clientTime - this.interpolationDelay;
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

    function Entity(id, maxUpdateBuffer) {
        this.updates = [];
        this.maxUpdateBuffer = maxUpdateBuffer;
        this.id = id;
        this.state = {};
        this.inputController = new InputController();
    }
    Entity.prototype = {
        addUpdate: function (state, seq, time) {
            var newUpdate = new Update(state, seq, time);
            if (this.updates.length === 0) {
                this.state = newUpdate.state;
            }
            this.updates.push(newUpdate);
            if (this.updates.length > this.maxUpdateBuffer) {
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
                this.addUpdate(state, seq, time);
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

    function Player(id, maxUpdateBuffer) {
        Entity.call(this, id, maxUpdateBuffer);
    }
    Player.prototype = Object.create(Entity.prototype);

    function EntityController(maxUpdateBuffer) {
        this.entities = [];
        this.maxUpdateBuffer = maxUpdateBuffer;
    }
    EntityController.prototype = {
        add: function (id) {
            var entity = new Entity(id, this.maxUpdateBuffer);
            this.entities.push(entity);
            return entity;
        },
        remove: function (id) {
            for (var i = 0; i < this.entities.length; i ++) {
                if (this.entities[i].id === id) {
                    this.entities.splice(i, 1);
                    return;
                }
            }
        }
    };

    function PlayerController(maxUpdateBuffer) {
        EntityController.call(this, maxUpdateBuffer);
    }
    PlayerController.prototype = Object.create(EntityController.prototype);
    PlayerController.prototype.add = function (id) {
        var player = new Player(id, this.maxUpdateBuffer);
        this.entities.push(player);
        return player;
    };

    var _io = socketio,
        _socket = null,
        _options = null,
        _stateController = new StateController(),
        _playerController = null,
        _entityController = null,

        initializeGarageServer = function (path, options) {
            _options = options;
            _socket = _io.connect(path + '/garageserver.io');
            registerSocketEvents();
        },

        registerSocketEvents = function () {
            _socket.on('connect', function () {
                _stateController.id = _socket.socket.sessionid;
                if (_options.logging) {
                    console.log('garageserver.io:: socket connect');
                }

                if (_options.onPlayerConnect) {
                    _options.onPlayerConnect(); 
                }
            });

            _socket.on('state', function (data) {
                if (_options.onWorldState) {
                    _options.onWorldState(data.worldState); 
                }
                _stateController.maxUpdateBuffer = data.maxUpdateBuffer;

                _playerController = new PlayerController(_stateController.maxUpdateBuffer);
                _entityController = new EntityController(_stateController.maxUpdateBuffer);

                _stateController.physicsDelta = data.physicsDelta;
                _stateController.interpolation = data.interpolation;
                _stateController.interpolationDelay = data.interpolationDelay;
                _stateController.pingInterval = data.pingInterval;
                _stateController.clientSidePrediction = data.clientSidePrediction;
                _stateController.smoothingFactor = data.smoothingFactor;
                _stateController.worldState = data.worldState;

                if(_options.onReady) {
                    _options.onReady();
                }

                setInterval(function (){
                    _socket.emit('ping', new Date().getTime());
                }, _stateController.pingInterval);
            });

            _socket.on('disconnect', function () {
                if (_options.logging) {
                    console.log('garageserver.io:: socket disconnect');
                }
                if (_options.onPlayerDisconnect) {
                    _options.onPlayerDisconnect();
                }
            });

            _socket.on('reconnect', function () {
                if (_options.logging) {
                    console.log('garageserver.io:: socket reconnect');
                }
                if (_options.onPlayerReconnect) {
                    _options.onPlayerReconnect();
                }
            });

            _socket.on('update', function (data) {
                update(data);
            });

            _socket.on('ping', function (data) {
                _stateController.pingDelay = new Date().getTime() - data;
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _stateController.pingDelay);
                }
                if (_options.onPing) {
                    _options.onPing(_stateController.pingDelay);
                }
            });

            _socket.on('removePlayer', function (id) {
                removePlayer(id);
                if (_options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
                if (_options.onPlayerRemove) {
                    _options.onPlayerRemove(id);
                }
            });

            _socket.on('removeEntity', function (id) {
                removeEntity(id);
                if (_options.logging) {
                    console.log('garageserver.io:: socket removeEntity ' + id);
                }
                if (_options.onEntityRemove) {
                    _options.onEntityRemove(id);
                }
            });

            _socket.on('event', function(data) {
                if (_options.logging) {
                    console.log('garageserver.io:: socket event ' + data);
                }
                if (_options.onEvent) {
                    _options.onEvent(data);
                }
            });
        },

        getId = function () {
            return _stateController.id;
        },

        sendServerEvent = function (data) {
            _socket.emit('event', data);
        },

        addInput = function (clientInput) {
            _playerController.entities.some(function (player) {
                if (player.id === _stateController.id) {
                    if (_stateController.clientSidePrediction && _options.onUpdatePlayerPrediction) {
                        player.inputController.add(clientInput);
                        player.state = _options.onUpdatePlayerPrediction(player.state, [{ input: clientInput }], _stateController.physicsDelta);
                    }
                    _socket.emit('input', [ clientInput, player.inputController.sequenceNumber, _stateController.renderTime ]);
                }
            });
        },
        
        getPlayerStates = function () {
            var playerStates = [];

            if (_stateController.interpolation && _options.onInterpolation) {
                processEntityStatesInterpolated(_playerController);
            } else {
                processEntityStatesCurrent(_playerController);
            }

            _playerController.entities.forEach(function(player) {
               playerStates.push({ id: player.id, state: player.state }); 
            });

            return playerStates;
        },

        getEntityStates = function () {
            var entityStates = [];
            
            if (_stateController.interpolation && _options.onInterpolation) {
                processEntityStatesInterpolated(_entityController);
            } else {
                processEntityStatesCurrent(_entityController);
            }

            _entityController.entities.forEach(function(entity) {
               entityStates.push({ id: entity.id, state: entity.state }); 
            });

            return entityStates;
        },

        removePlayer = function (id) {
            _playerController.remove(id);
        },

        removeEntity = function (id) {
            _entityController.remove(id);
        },

        update = function (data) {
            _stateController.setTime(data.time);

            updatePlayers(data);
            updateEntities(data);
        },

        updatePlayers = function (data) {
            data.playerStates.forEach(function (playerState) {
                updateEntity(_playerController, playerState, data.time);

                if (_options.onPlayerUpdate) {
                    _options.onPlayerUpdate(playerState[1]);
                }
            });
        },

        updateEntities = function (data) {
            data.entityStates.forEach(function (entityState) {
                updateEntity(_entityController, entityState, data.time);

                if (_options.onEntityUpdate) {
                    _options.onEntityUpdate(entityState[1]);
                }
            });
        },

        updateEntity = function (entityController, entityState, time) {
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
                newEntity.addUpdate(entityState[1], entityState[2], time);
            }
        },

        processEntityStatesCurrent = function (entityController) {
            entityController.entities.forEach(function (entity) {
                if (entity.anyUpdates() && !entity.inputController.any()) {
                    entity.state = entity.latestUpdate().state;
                }
            });
        },

        processEntityStatesInterpolated = function (entityController) {
            var positions, amount, newState;
            entityController.entities.forEach(function (entity) {
                if (entity.anyUpdates() && !entity.inputController.any()) {
                    positions = entity.surroundingPositions(_stateController.renderTime);
                    if (positions.previous && positions.target) {
                        amount = getInterpolatedAmount(positions.previous.time, positions.target.time);
                        newState = _options.onInterpolation(positions.previous.state, positions.target.state, amount);
                        entity.state = newState = _options.onInterpolation(entity.state, newState, _stateController.smoothingFactor);
                    }
                    else {
                        entity.state = entity.latestUpdate().state;
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
        addInput: addInput,
        getPlayerStates: getPlayerStates,
        getEntityStates: getEntityStates,
        getId: getId,
        sendServerEvent: sendServerEvent
    };

}) (window.io);