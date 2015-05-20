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
    onUpdateClientPredictionReady(callback(playerId, playerCurrentState, entityCurrentStates, inputs, deltaTime)),
    onInterpolation(callback(previousState, targetState, amount) : newState),
    onReady(callback),
    logging: true
}
api methods
    initializeGarageServer(path, options)
    addInput(input)
    getPlayerStates : [, playerState]
    getEntityStates : [, entityState]
    updatePlayerState(id, state)
    addEntity(id, state)
    updateEntityState(id, state)
    removeEntity(id)
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

    function Entity(id, referrerId, referrerSeq, maxUpdateBuffer) {
        this.updates = [];
        this.maxUpdateBuffer = maxUpdateBuffer;
        this.id = id;
        this.referrerId = referrerId;
        this.referrerSeq = referrerSeq;
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
        Entity.call(this, id, null, null, maxUpdateBuffer);
    }
    Player.prototype = Object.create(Entity.prototype);

    function EntityController(maxUpdateBuffer) {
        this.entities = [];
        this.maxUpdateBuffer = maxUpdateBuffer;
    }
    EntityController.prototype = {
        add: function (id, referrerId) {
            var referrerSeq = this.entities.filter(function (value) { return value.referrerId === referrerId; }).length;
            var entity = new Entity(id, referrerId, referrerSeq, this.maxUpdateBuffer);
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
            if(path == null || path.length <= 0) {
                throw new Error('GarageServer.IO client is missing the server path - please verify the path argument passed to GarageServerIO.initializeGarageServer.');
            }
            _socket = _io.connect(path + '/garageserver.io');
            registerSocketEvents();
        },

        registerSocketEvents = function () {
            _socket.on('connect', function () {
                _stateController.id = _socket.io.engine.id;
                if (_options.logging) {
                    console.log('garageserver.io:: socket connect');
                }

                if (_options.onPlayerConnect) {
                    _options.onPlayerConnect(); 
                }
            });

            _socket.on('s', function (data) {
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
                    _socket.emit('p', new Date().getTime());
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

            _socket.on('u', function (data) {
                update(data);
            });

            _socket.on('p', function (data) {
                _stateController.pingDelay = new Date().getTime() - data;
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _stateController.pingDelay);
                }
                if (_options.onPing) {
                    _options.onPing(_stateController.pingDelay);
                }
            });

            _socket.on('rp', function (id) {
                removePlayer(id);
                if (_options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
                if (_options.onPlayerRemove) {
                    _options.onPlayerRemove(id);
                }
            });

            _socket.on('re', function (data) {
                if (_stateController.clientSidePrediction) {
                    _entityController.entities.forEach(function (entity) {
                        if (entity.referrerId === data.id && entity.referrerSeq === data.seq) {
                            removeEntity(entity.id);
                        } 
                    });
                }
                else {
                    removeEntity(data.id);
                }
                
                if (_options.logging) {
                    console.log('garageserver.io:: socket removeEntity ' + data.id);
                }
                if (_options.onEntityRemove) {
                    _options.onEntityRemove(data.id);
                }
            });

            _socket.on('e', function(data) {
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
            _socket.emit('e', data);
        },

        addInput = function (clientInput) {
            _playerController.entities.some(function (player) {
                if (player.id === _stateController.id) {
                    if (_stateController.clientSidePrediction && _options.onUpdateClientPredictionReady) {
                        var entityCurrentStates = [];
                        _entityController.entities.forEach(function(entity) {
                            if (entity.referrerId === player.id) {
                                entityCurrentStates.push({ id: entity.id, state: entity.state }); 
                            }
                        });
            
                        player.inputController.add(clientInput);
                        _options.onUpdateClientPredictionReady(player.id, player.state, entityCurrentStates, [{ input: clientInput }], _stateController.physicsDelta);
                    }
                    _socket.emit('i', [ clientInput, player.inputController.sequenceNumber, _stateController.renderTime ]);
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
        
        updatePlayerState = function (id, state) {
            _playerController.entities.some(function(player) {
                if (player.id === id) {
                    player.state = state;
                    return true;
                }
            });
        },

        removePlayer = function (id) {
            _playerController.remove(id);
        },

        addEntity = function (id) {
            _entityController.add(id, _stateController.id);
        },
        
        updateEntityState = function (id, state) {
            _entityController.entities.some(function(entity) {
                if (entity.id === id) {
                    entity.state = state;
                    return true;
                }
            });
        },
        
        removeEntity = function (id) {
            _entityController.remove(id);
        },

        update = function (data) {
            _stateController.setTime(data.t);

            updatePlayers(data);
            updateEntities(data);
        },

        updatePlayers = function (data) {
            data.ps.forEach(function (playerState) {
                var playerFound = false;
                _playerController.entities.some(function (player) {
                    if (player.id === playerState[0]) {
                        playerFound = true;
                        player.updateState(playerState[1], playerState[2], data.t);
                        return true;
                    }
                });

                if (!playerFound) {
                    var newPlayer = _playerController.add(playerState[0]);
                    newPlayer.addUpdate(playerState[1], playerState[2], data.t);
                }

                if (_options.onPlayerUpdate) {
                    _options.onPlayerUpdate(playerState[1]);
                }
            });
        },

        updateEntities = function (data) {
            data.es.forEach(function (entityState) {
                var entityFound = false;
                _entityController.entities.some(function (entity) {
                    if (entity.id === entityState[0] || (entity.referrerId === entityState[3] && entity.referrerSeq === entityState[4])) {
                        entityFound = true;
                        entity.updateState(entityState[1], entityState[2], data.t);
                        return true;
                    }
                });

                if (!entityFound) {
                    var newEntity = _entityController.add(entityState[0]);
                    newEntity.addUpdate(entityState[1], entityState[2], data.t);
                }

                if (_options.onEntityUpdate) {
                    _options.onEntityUpdate(entityState[1]);
                }
            });
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
                    else if (entity.inputController.sequenceNumber === 1) {
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
        updatePlayerState: updatePlayerState,
        addEntity: addEntity,
        updateEntityState: updateEntityState,
        removeEntity: removeEntity,
        getId: getId,
        sendServerEvent: sendServerEvent
    };

}) (window.io);