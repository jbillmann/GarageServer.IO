/*
options = {
    onPlayerConnect: function()
    onPlayerDisconnect: function (),
    onPlayerReconnect: function (),
    onPlayerUpdate: function (state),
    onPlayerRemove: function (id),
    onGameState: function (state),
    onPing: function (pingDelay),
    onUpdatePlayerPhysics: function (id, state, inputs, deltaTime),
    onUpdate: function (),
    onInterpolation: function(id, previousState, targetState, amount)
    logging: true,
    clientSidePrediction: true,
    interpolation: true,
    interpolationDelay: 100,
    pingInterval: 2000
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
        addInput: function (input) {
            this.sequenceNumber += 1;
            this.inputs.push(new Input(input, this.sequenceNumber));
        },
        removeUpToSequence: function (seq) {
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

    function Entity() {
        this.updates = [];
        this.id;
        this.currentState = {};
    }
    Entity.prototype = {
        anyUpdates: function () {
            return this.updates.length > 0;
        },
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
        getLatestUpdate: function () {
            return this.updates[this.updates.length - 1];
        },
        processState: function (state, seq, time) {
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
        getSurroundingPositions: function (time) {
            var positions = {};
            for (var i = 0; i < this.updates.length; i ++) {
                var previous = this.updates[i];
                var target = this.updates[i + 1];

                if(previous && target && time > previous.time && time < target.time) {
                    positions.previous = previous;
                    positions.target = target;
                    break;
                }
            }
            return positions;
        }
    };

    function Player(id) {
        Entity.call(this);
        this.id = id;
    }
    Player.prototype = Object.create(Entity.prototype);

    function PlayerController() {
        this.players = [];
    }
    PlayerController.prototype = {
        addPlayer: function (id) {
            var player = new Player(id);
            this.players.push(player);
            return player;
        },
        removePlayer: function (id) {
            for (var i = 0; i < this.players.length; i ++) {
                this.players.splice(i, 1);
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

        initializeGarageServer = function (path, opts) {
            _options = opts;
            _socket = _io.connect(path + '/garageserver.io');
            registerSocketEvents();
            registerPinger();
        },

        registerSocketEvents = function () {
            _socket.on('connect', function () {
                _stateController.playerId = _socket.id;
                _stateController.interpolationDelay = _options.interpolationDelay ? _options.interpolationDelay : 100;
                if (_options.onPlayerConnect) {
                    _options.onPlayerConnect(); 
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket connect');
                }
            });
            _socket.on('state', function(data) {
                if (_options.onGameState) {
                    _options.onGameState(data); 
                }
                _stateController.physicsDelta = data.physicsDelta;
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
            _socket.on('update', function(data) {
                updateState(data);
            });
            _socket.on('ping', function(data) {
                _stateController.pingDelay = new Date().getTime() - data;
                if (_options.onPing) {
                    _options.onPing(_stateController.pingDelay);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _stateController.pingDelay);
                }
            });
            _socket.on('removePlayer', function(id) {
                removePlayer(id);
                if (_options.onPlayerRemove) {
                    _options.onPlayerRemove(id);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
            });
        },

        registerPinger = function () {
            var interval = 2000;
            if (_options.pingInterval) {
                interval = _options.pingInterval;
            }
            setInterval(function (){
                _socket.emit('ping', new Date().getTime());
            }, interval);
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
            _playerController.removePlayer(id);
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
            _inputController.addInput(clientInput);
            if (_options.clientSidePrediction && _options.onUpdatePlayerPhysics) {
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
            _inputController.removeUpToSequence(playerState[2]);

            if (_options.clientSidePrediction && _inputController.any()) {
                _stateController.state = _options.onUpdatePlayerPhysics(_stateController.playerId, _stateController.state, _inputController.inputs, _stateController.physicsDelta);
            }
        },
        
        updateOtherPlayersState = function (playerState, time) {
            var playerFound = false;
            _playerController.players.some(function (player) {
                if (player.id === playerState[0]) {
                    playerFound = true;
                    player.processState(playerState[1], playerState[2], time);
                    return true;
                }
            });
            if (!playerFound) {
                var newPlayer = _playerController.addPlayer(playerState[0]);
                newPlayer.addUpate(playerState[1], playerState[2], time);
            }
        },

        updateEntitiesState = function (data) {
            
        },

        getPlayerStates = function (stateCallback) {
            if(_options.interpolation && _options.onInterpolation) {
                getPlayerStatesInterpolated(stateCallback);
            }
            else {
                getPlayerStatesCurrent(stateCallback);
            }
            stateCallback(_stateController.state);
        },

        getPlayerStatesCurrent = function (stateCallback) {
            _playerController.players.forEach(function (player) {
                if (player.anyUpdates()) {
                    stateCallback(player.getLatestUpdate().state);
                }
            });
        },

        getPlayerStatesInterpolated = function (stateCallback) {
            var positions, amount, newState;
            _playerController.players.forEach(function (player) {
                if (player.anyUpdates()) {
                    positions = player.getSurroundingPositions(_stateController.renderTime);
                    if (positions.previous && positions.target) {
                        amount = getInterpolatedAmount(positions.previous.time, positions.target.time);
                        newState = _options.onInterpolation(player.id, positions.previous.state, positions.target.state, amount);
                        player.currentState = newState = _options.onInterpolation(player.id, player.currentState, newState, _stateController.physicsDelta * 20);
                        stateCallback(player.currentState);
                    }
                    else {
                        stateCallback(player.currentState);
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
        getPlayerStates: getPlayerStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState
    };

}) (window, io);