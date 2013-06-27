/*
options = {
    onPlayerConnect: function()
    onPlayerDisconnect: function (),
    onPlayerReconnect: function (),
    onPlayerUpdate: function (data),
    onPlayerRemove: function (id),
    onPing: function (data),
    onUpdatePlayerPhysics: function (state, inputs),
    onInterpolation: function(currentState, previousState, targetState, amount)
    logging: true,
    clientSidePrediction: true,
    interpolation: true,
    pingInterval: 2000
}
*/

window.GarageServerIO = (function (window, socketio) {

    var io = socketio,
        socket = null,
        options = null,
        pingDelay = 100,

        Controllers = (function () {
            function InputController () {
                this.inputs = [];
                this.sequenceNumber = 1;
            }
            InputController.prototype = {
                any: function () {
                    return this.inputs.length > 0;
                },
                getSequence: function () {
                    return this.sequenceNumber;
                },
                addInput: function (input) {
                    this.sequenceNumber += 1;
                    this.inputs.push({ input: input, seq: this.sequenceNumber });
                },
                getInputs: function () {
                    return this.inputs;
                },
                removeUpToSequence: function (seq) {
                    for (var i = 0; i < this.inputs.length; i ++) {
                        if (this.inputs[i].seq == seq) {
                            this.inputs.splice(0, i + 1);
                            break;
                        }
                    }
                }
            };

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
                },
                forEach: function (callback) {
                    for (var i = 0; i < this.players.length; i ++) {
                        callback(this.players[i]);
                    }
                }
            };
            
            return {
                Input: InputController,
                State: StateController,
                Player: PlayerController
            };

        }) (),

        stateController = new Controllers.State(),
        inputController = new Controllers.Input(),
        playerController = new Controllers.Player(),

        connectToGarageServer = function (path, opts) {
            options = opts;
            socket = io.connect(path + '/garageserver.io');
            registerSocketEvents();
            registerPinger();
        },

        registerSocketEvents = function () {
            socket.on('connect', function () {
                stateController.playerId = socket.id;
                if (options.onPlayerConnect) {
                    options.onPlayerConnect(); 
                }
            });
            socket.on('disconnect', function () {
                if (options.onPlayerDisconnect) {
                    options.onPlayerDisconnect();
                }
            });
            socket.on('reconnect', function () {
                if (options.onPlayerReconnect) {
                    options.onPlayerReconnect();
                }
            });
            socket.on('update', function(data) {
                updateState(data);
            });
            socket.on('ping', function(data) {
                pingDelay = new Date().getTime() - data;
                if (options.logging) {
                    console.log('garageserver.io:: socket ping delay ' + pingDelay);
                }
            });
            socket.on('removePlayer', function(id) {
                removePlayer(id);
                if (options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
            });
        },

        registerPinger = function () {
            var interval = 2000;
            if (options.pingInterval) {
                interval = options.pingInterval;
            }
            setInterval(function (){
                socket.emit('ping', new Date().getTime());
            }, interval);
        },

        getPlayerId = function () {
            return stateController.playerId;
        },

        setPlayerState = function (state) {
            socket.emit('state', state);
        },

        removePlayer = function (id) {
            playerController.removePlayer(id);

            if (options.onPlayerRemove) {
                options.onPlayerRemove(id);
            }
        },

        addPlayerInput = function (clientInput) {
            inputController.addInput(clientInput);

            if (options.clientSidePrediction && options.onUpdatePlayerPhysics) {
                stateController.state = options.onUpdatePlayerPhysics(stateController.state, [{ input: clientInput }]);
            }
            socket.emit('input', { input: clientInput, seq: inputController.getSequence() });
        },

        updateState = function (data) {
            stateController.setTime(data.time, pingDelay);
            stateController.frameTime = new Date().getTime();
            stateController.delta = data.delta;

            updatePlayerState(data);
            updateEntityState(data);
        },

        updatePlayerState = function (data) {
            var playerFound = false,
                stateIdx = 0,
                playerState;

            for(stateIdx = 0; stateIdx < data.playerStates.length; stateIdx ++) {
                playerFound = false;
                playerState = data.playerStates[stateIdx];

                if (socket.socket.sessionid === playerState.id) {
                    stateController.state = playerState.state;
                    inputController.removeUpToSequence(playerState.seq);

                    if (options.clientSidePrediction && inputController.any()) {
                        stateController.state = options.onUpdatePlayerPhysics(stateController.state, inputController.getInputs());
                    }
                } else {
                    playerController.forEach(function (player) {
                        if (player.id === playerState.id) {
                            playerFound = true;
                            player.processState(playerState, data.time);
                        }
                        return;
                    });
                    if (!playerFound) {
                        var newPlayer = playerController.addPlayer(playerState.id);
                        newPlayer.addUpate(playerState.state, playerState.seq, data.time);
                    }
                }

                if (options.onPlayerUpdate) {
                    options.onPlayerUpdate(playerState);
                }
            }
        },
        
        updateEntityState = function (data) {
            
        },

        getPlayerStates = function (stateCallback) {
            playerController.forEach(function (player) {
                if (player.anyUpdates()) {
                    var latestUpdate = player.getLatestUpdate();

                    if (options.interpolation && options.onInterpolation) {
                        var positions = player.getPositions(stateController.time, stateController.frameTime);
                        if (positions.previousState && positions.targetState) {
                            stateCallback(options.onInterpolation(latestUpdate.state, positions.previousState, positions.targetState, positions.amount));
                        }
                        else {
                            stateCallback(latestUpdate.state);
                        }
                    } else {
                        stateCallback(latestUpdate.state);
                    }
                }
            });
            stateCallback(stateController.state);
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState
    };

}) (window, io);