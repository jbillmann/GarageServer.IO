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
        players = [],
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
                getUpdate: function (seq) {
                    for (var i = 0; i < this.updates.length; i ++) {
                        if (this.updates[i].seq == seq) {
                            return this.updates[i];
                        }
                    }
                },
                getLatestUpdate: function () {
                    return this.updates[this.updates.length - 1];
                },
                forEachUpdate: function (callback) {
                    for (var i = 0; i < this.updates.length; i ++) {
                        callback(this.updates[i]);
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
                getPlayer: function (id) {
                    for (var i = 0; i < this.players.length; i ++) {
                        if (this.players[i].id == id) {
                            return this.players[i];
                        }
                    }
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

        connectToGarageServer = function (path, opts) {
            options = opts;
            socket = io.connect(path + '/garageserver.io');
            registerSocketEvents();
            registerPinger();
        },

        registerSocketEvents = function () {
            socket.on('connect', function () {
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

        updateState = function (data) {
            stateController.setTime(data.time, pingDelay);
            stateController.frameTime = new Date().getTime();
            stateController.delta = data.delta;

            updatePlayerState(data);
            updateEntityState(data);
        },

        updatePlayerState = function (data) {
            var updateFound = false,
                playerFound = false,
                playerIdx = 0,
                updateIdx = 0,
                stateIdx = 0,
                playerState;

            for(stateIdx = 0; stateIdx < data.playerStates.length; stateIdx ++) {
                playerFound = false;
                updateFound = false;
                playerState = data.playerStates[stateIdx];

                if (socket.socket.sessionid === playerState.id) {
                    stateController.state = playerState.state;
                    stateController.playerId = playerState.id;

                    if (options.clientSidePrediction) {
                        inputController.removeUpToSequence(playerState.seq);
                        if (inputController.any()) {
                            stateController.state = options.onUpdatePlayerPhysics(stateController.state, inputController.getInputs());
                        }
                    }
                } else {
                    for (playerIdx = 0; playerIdx < players.length; playerIdx ++) {
                        if (players[playerIdx].id === playerState.id) {
                            playerFound = true;
                            for (updateIdx = 0; updateIdx < players[playerIdx].updates.length; updateIdx ++) {
                                if (players[playerIdx].updates[updateIdx].seq === playerState.seq) {
                                    players[playerIdx].updates[updateIdx].state = playerState.state;
                                    updateFound = true;
                                    break;
                                }
                            }
                            if (!updateFound) {
                                players[playerIdx].updates.push({ state: playerState.state, seq: playerState.seq, time: data.time });
                                if (players[playerIdx].updates.length > 60) {
                                    players[playerIdx].updates.splice(0, 1);
                                }
                            }
                            break;
                        }
                    }

                    if (!playerFound) {
                        var player = {
                            id: playerState.id,
                            updates: []
                        };
                        player.updates.push({ state: playerState.state, seq: playerState.seq, time: data.time });
                        players.push(player);
                    }
                }

                if (options.onPlayerUpdate) {
                    options.onPlayerUpdate(playerState);
                }
            }
        },
        
        updateEntityState = function (data) {
            
        },

        removePlayer = function (id) {
            for (var i = 0; i < players.length; i ++) {
                if (players[i].id === id) {
                    players.splice(i, 1)[0];
                    return;
                }
            }

            if (options.onPlayerRemove) {
                options.onPlayerRemove(id);
            }
        },

        addPlayerInput = function (clientInput) {
            inputController.addInput(clientInput);

            if (options.clientSidePrediction && options.onUpdatePlayerPhysics) {
                stateController.state = options.onUpdatePlayerPhysics(stateController.state, [{ input: clientInput }]);
            }
            sendPlayerInput(clientInput);
        },

        sendPlayerInput = function (clientInput) {
            socket.emit('input', { input: clientInput, seq: inputController.getSequence() });
        },
        
        getPositions = function (playerUpdates) {
            var positions = {},
                range,
                difference,
                amount;

            for (var updateIdx = 0; updateIdx < playerUpdates.length; updateIdx ++) {
                var previous = playerUpdates[updateIdx];
                var target = playerUpdates[updateIdx + 1];
                
                if(previous && target && stateController.time > previous.time && stateController.time < target.time) {
                    var frameDiff = new Date().getTime() - stateController.frameTime;
                    
                    range = target.time - previous.time;
                    difference = stateController.time - previous.time + frameDiff;
                    amount = parseFloat((difference / range).toFixed(3));

                    positions.previousState = previous.state;
                    positions.targetState = target.state;
                    positions.amount = amount;

                    break;
                }
            }
            return positions;
        },

        getPlayerStates = function (stateCallback) {
            var maxUpdate = 0;
            for (var playerIdx = 0; playerIdx < players.length; playerIdx ++) {
                if (players[playerIdx].updates.length > 0) {
                    maxUpdate = players[playerIdx].updates.length - 1;

                    if (options.interpolation && options.onInterpolation) {
                        var positions = getPositions(players[playerIdx].updates);
                        if (positions.previousState && positions.targetState) {
                            stateCallback(options.onInterpolation(players[playerIdx].updates[maxUpdate].state, positions.previousState, positions.targetState, positions.amount));
                        }
                        else {
                            stateCallback(players[playerIdx].updates[maxUpdate].state);
                        }
                    } else {
                        stateCallback(players[playerIdx].updates[maxUpdate].state);
                    }
                }
            }
            stateCallback(stateController.state);
        },

        getPlayerId = function () {
            return stateController.playerId;
        },

        setPlayerState = function (state) {
            socket.emit('state', state);
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates,
        getPlayerId: getPlayerId,
        setPlayerState: setPlayerState
    };

}) (window, io);