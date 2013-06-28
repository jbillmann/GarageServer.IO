/*
options = {
    onPlayerConnect: function()
    onPlayerDisconnect: function (),
    onPlayerReconnect: function (),
    onPlayerUpdate: function (state),
    onPlayerRemove: function (id),
    onPing: function (pingDelay),
    onUpdatePlayerPhysics: function (state, inputs),
    onInterpolation: function(currentState, previousState, targetState, amount)
    logging: true,
    clientSidePrediction: true,
    interpolation: true,
    pingInterval: 2000
}
*/

window.GarageServerIO = (function (window, socketio) {

    function StateController () {
        this.state = {};
        this.time;
        this.frameTime = new Date().getTime();
        this.delta;
        this.playerId;
    }
    StateController.prototype = {
        setTime: function (serverTime, delay) {
            this.time = serverTime - delay / 2;
        }
    };

    function InputController () {
        this.inputs = [];
        this.sequenceNumber = 1;
    }
    InputController.prototype = {
        any: function () {
            return this.inputs.length > 0;
        },
        addInput: function (input) {
            this.sequenceNumber += 1;
            this.inputs.push({ input: input, seq: this.sequenceNumber });
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

    function Player (id) {
        this.updates = [];
        this.id = id;
    }
    Player.prototype = {
        anyUpdates: function () {
            return this.updates.length > 0;
        },
        addUpate: function (state, seq, time) {
            this.updates.push({ state: state, seq: seq, time: time });
            if (this.updates.length > 60) {
                this.updates.updates.splice(0, 1);
            }
        },
        getLatestUpdate: function () {
            return this.updates[this.updates.length - 1];
        },
        processState: function (playerState, time) {
            var updateFound = false;
            for (var i = 0; i < this.updates.length; i ++) {
                if (this.updates[i].seq === playerState.seq) {
                    this.updates[i].state = playerState.state;
                    updateFound = true;
                    break;
                }
            }
            if (!updateFound) {
                this.updates.push({ state: playerState.state, seq: playerState.seq, time: time });
                if (this.updates.length > 60) {
                    this.updates.splice(0, 1);
                }
            }
        },
        getPositions: function (time, frameTime) {
            var positions = {}, range, difference, amount;
            for (var i = 0; i < this.updates.length; i ++) {
                var previous = this.updates[i];
                var target = this.updates[i + 1];
        
                if(previous && target && time > previous.time && time < target.time) {
                    var frameDiff = new Date().getTime() - frameTime;
                    range = target.time - previous.time;
                    difference = time - previous.time + frameDiff;
                    amount = parseFloat((difference / range).toFixed(3));
                    positions.previousState = previous.state;
                    positions.targetState = target.state;
                    positions.amount = amount;
                    break;
                }
            }
            return positions;
        }
    };

    function PlayerController () {
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
        _pingDelay = 100,
        _stateController = new StateController(),
        _inputController = new InputController(),
        _playerController = new PlayerController(),

        connectToGarageServer = function (path, opts) {
            _options = opts;
            _socket = _io.connect(path + '/garageserver.io');
            registerSocketEvents();
            registerPinger();
        },

        registerSocketEvents = function () {
            _socket.on('connect', function () {
                _stateController.playerId = _socket.id;
                if (_options.onPlayerConnect) {
                    _options.onPlayerConnect(); 
                }
            });
            _socket.on('disconnect', function () {
                if (_options.onPlayerDisconnect) {
                    _options.onPlayerDisconnect();
                }
            });
            _socket.on('reconnect', function () {
                if (_options.onPlayerReconnect) {
                    _options.onPlayerReconnect();
                }
            });
            _socket.on('update', function(data) {
                updateState(data);
            });
            _socket.on('ping', function(data) {
                _pingDelay = new Date().getTime() - data;
                if (_options.onPing) {
                    _options.onPing(_pingDelay);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _pingDelay);
                }
            });
            _socket.on('removePlayer', function(id) {
                removePlayer(id);
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

        getPlayerId = function () {
            return _stateController.playerId;
        },

        setPlayerState = function (state) {
            _socket.emit('state', state);
        },

        removePlayer = function (id) {
            _playerController.removePlayer(id);

            if (_options.onPlayerRemove) {
                _options.onPlayerRemove(id);
            }
        },

        addPlayerInput = function (clientInput) {
            _inputController.addInput(clientInput);

            if (_options.clientSidePrediction && _options.onUpdatePlayerPhysics) {
                _stateController.state = _options.onUpdatePlayerPhysics(_stateController.state, [{ input: clientInput }]);
            }
            _socket.emit('input', { input: clientInput, seq: _inputController.sequenceNumber });
        },

        updateState = function (data) {
            _stateController.setTime(data.time, _pingDelay);
            _stateController.frameTime = new Date().getTime();
            _stateController.delta = data.delta;

            updatePlayersState(data);
            updateEntitiesState(data);
        },

        updatePlayersState = function (data) {
            data.playerStates.forEach(function (playerState) {
                if (_socket.socket.sessionid === playerState.id) {
                    updatePlayerState(playerState);
                } else {
                    updateOtherPlayersState(playerState, data.time);
                }

                if (_options.onPlayerUpdate) {
                    _options.onPlayerUpdate(playerState.state);
                }
            });
        },
        
        updatePlayerState = function (playerState) {
            _stateController.state = playerState.state;
            _inputController.removeUpToSequence(playerState.seq);

            if (_options.clientSidePrediction && _inputController.any()) {
                _stateController.state = _options.onUpdatePlayerPhysics(_stateController.state, _inputController.inputs);
            }
        },
        
        updateOtherPlayersState = function (playerState, time) {
            var playerFound = false;
            _playerController.players.forEach(function (player) {
                if (player.id === playerState.id) {
                    playerFound = true;
                    player.processState(playerState, time);
                }
                return;
            });
            if (!playerFound) {
                var newPlayer = _playerController.addPlayer(playerState.id);
                newPlayer.addUpate(playerState.state, playerState.seq, time);
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
                    stateCallback(player.getLatestUpdate());
                }
            });
        },
        
        getPlayerStatesInterpolated = function (stateCallback) {
            _playerController.players.forEach(function (player) {
                if (player.anyUpdates()) {
                    var latestUpdate = player.getLatestUpdate(),
                        positions = player.getPositions(_stateController.time, _stateController.frameTime);
                    if (positions.previousState && positions.targetState) {
                        stateCallback(_options.onInterpolation(latestUpdate.state, positions.previousState, positions.targetState, positions.amount));
                    }
                    else {
                        stateCallback(latestUpdate.state);
                    }
                }
            });
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState
    };

}) (window, io);