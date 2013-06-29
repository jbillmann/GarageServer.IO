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
    clientSmoothing: true,
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
        this.clientSmoothing = 1;
        this.pingDelay = 100;
        this.fps = 0;
        this.fpsLastUpdate = (new Date()) * 1 - 1;
        this.fpsFilter = 50;
    }
    StateController.prototype = {
        setTime: function (serverTime, delay) {
            this.time = serverTime - delay / 2;
        }
    };

    function Input (input, seq) {
        this.input = input;
        this.seq = seq;
    }

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

    function Player (id) {
        this.updates = [];
        this.id = id;
    }
    Player.prototype = {
        anyUpdates: function () {
            return this.updates.length > 0;
        },
        addUpate: function (state, seq, time) {
            this.updates.push(new Update(state, seq, time));
            if (this.updates.length > 120) {
                this.updates.splice(0, 1);
            }
        },
        getLatestUpdate: function () {
            return this.updates[this.updates.length - 1];
        },
        processState: function (playerState, time) {
            var updateFound = false;
            this.updates.some(function (update) {
               if (update.seq === playerState.seq) {
                   update.state = playerState.state;
                   updateFound = true;
                   return true;
               } 
            });
            if (!updateFound) {
                this.addUpate(playerState.state, playerState.seq, time);
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
                if (_options.logging) {
                    console.log('garageserver.io:: socket connect');
                }
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
                var newPingDelay = new Date().getTime() - data;
                _stateController.clientSmoothing = _options.clientSmoothing ? ((_stateController.clientSmoothing + (_stateController.pingDelay / newPingDelay)) / 2) : 1;
                _stateController.pingDelay = newPingDelay;
                if (_options.onPing) {
                    _options.onPing(_stateController.pingDelay);
                }
                if (_options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + _stateController.pingDelay);
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
            _socket.emit('input', { input: clientInput, seq: _inputController.sequenceNumber, time: _stateController.time });
        },

        updateState = function (data) {
            _stateController.setTime(data.time, _stateController.pingDelay);
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
            _playerController.players.some(function (player) {
                if (player.id === playerState.id) {
                    playerFound = true;
                    player.processState(playerState, time);
                    return true;
                }
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
            var latestUpdate, positions, amount;
            _playerController.players.forEach(function (player) {
                if (player.anyUpdates()) {
                    latestUpdate = player.getLatestUpdate();
                    positions = player.getSurroundingPositions(_stateController.time);
                    if (positions.previous && positions.target) {
                        amount = getInterpolatedAmount(positions.previous.time, positions.target.time);
                        stateCallback(_options.onInterpolation(latestUpdate.state, positions.previous.state, positions.target.state, amount));
                    }
                    else {
                        stateCallback(latestUpdate.state);
                    }
                }
            });
        },

        getInterpolatedAmount = function (previousTime, targetTime) {
            var frameDiff = new Date().getTime() - _stateController.frameTime,
                range = targetTime - previousTime,
                difference = _stateController.time - previousTime + (frameDiff * _stateController.clientSmoothing),
                amount = parseFloat((difference / range).toFixed(3));

            return amount;
        },
        
        getFPS = function () {
            var now,
                thisFrameFPS = 1000 / ((now = new Date()) - _stateController.fpsLastUpdate);

            _stateController.fps += (thisFrameFPS - _stateController.fps) / _stateController.fpsFilter;
            _stateController.fpsLastUpdate = now;

            return Math.round(_stateController.fps);
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState,
        getFPS: getFPS
    };

}) (window, io);