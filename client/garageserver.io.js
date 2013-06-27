/*
options = {
    onPlayerConnect: function()
    onPlayerDisconnect: function (),
    onPlayerReconnect: function (),
    onPlayerUpdate: function (data),
    onPlayerRemove: function (id),
    onPing: function (data),
    onUpdatePlayerPhysics: function (state, inputs),
    onInterpolation: function(previousState, targetState, amount)
    logging: true,
    clientSidePrediction: true,
    interpolation: true,
    pingInterval: 2000
}
*/

window.GarageServerIO = (function (window, socketio) {

    var io = socketio,
        socket = null,
        sequenceNumber = 1,
        players = [],
        inputs = [],
        currentState = {},
        currentTime,
        currentDelta,
        currentPlayerId,
        options = null,
        pingDelay = 100,

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
            currentTime = data.time - pingDelay / 2;
            currentDelta = data.delta;

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
                    currentState = playerState.state;
                    currentPlayerId = playerState.id;

                    if (options.clientSidePrediction) {
                        for (updateIdx = 0; updateIdx < inputs.length; updateIdx ++) {
                            if (inputs[updateIdx].seq == playerState.seq) {
                                inputs.splice(0, updateIdx + 1);
                                break;
                            }
                        }
                        if (inputs.length > 0) {
                            currentState = options.onUpdatePlayerPhysics(currentState, inputs);
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
            var inputsToProcess = [];

            sequenceNumber += 1;
            inputs.push({ input: clientInput, seq: sequenceNumber });

            if (options.clientSidePrediction && options.onUpdatePlayerPhysics) {
                inputsToProcess.push({ input: clientInput });
                currentState = options.onUpdatePlayerPhysics(currentState, inputsToProcess);
            }
            sendPlayerInput(clientInput);
        },

        sendPlayerInput = function (clientInput) {
            socket.emit('input', { input: clientInput, seq: sequenceNumber });
        },
        
        getPositions = function (playerUpdates) {
            var positions = {},
                range,
                difference,
                amount;

            for (var updateIdx = 0; updateIdx < playerUpdates.length; updateIdx ++) {
                var previous = playerUpdates[updateIdx];
                var target = playerUpdates[updateIdx + 1];
                
                if(previous && target && currentTime > previous.time && currentTime < target.time) {
                    range = target.time - previous.time;
                    difference = currentTime - previous.time;
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
                            stateCallback(options.onInterpolation(positions.previousState, positions.targetState, positions.amount));
                        }
                        else {
                            stateCallback(players[playerIdx].updates[maxUpdate].state);
                        }
                    } else {
                        stateCallback(players[playerIdx].updates[maxUpdate].state);
                    }
                }
            }
            stateCallback(currentState);
        },
        
        getPlayerId = function () {
            return currentPlayerId;
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