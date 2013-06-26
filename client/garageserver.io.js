/*
options = {
    onConnect: function()
    onPlayerUpdate: function (data),
    onPlayerDisconnect: function (id),
    onPing: function (data),
    logging: true,
    clientSidePrediction: true,
    onUpdatePlayerPhysics: function (state, inputs),
    interpolation: true,
    onInterpolation: function(statePrevious, stateTarget, amount)
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
        options = null,
        pingDelay = 100,

        // TODO: DONE CALLBACK
        connectToGarageServer = function (path, opts) {
            socket = io.connect(path + '/garageserver.io');
            options = opts;
            registerSocketEvents();
            registerPinger();
        },

        registerSocketEvents = function () {
            socket.on('update', function(data) {
                updateState(data);
                if (options.logging) {
                    //console.log('garageserver.io:: socket state update');
                }
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
                                players[playerIdx].updates.push({ state: playerState.state, seq: playerState.seq, time: playerState.time });
                            }
                            break;
                        }
                    }

                    if (!playerFound) {
                        var player = {
                            id: playerState.id,
                            updates: []
                        };
                        player.updates.push({ state: playerState.state, seq: playerState.seq, time: playerState.time });
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

            if (options.onPlayerDisconnect) {
                options.onPlayerDisconnect(id);
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

        getPlayerStates = function (stateCallback) {
            var maxUpdate = 0;
            for (var playerIdx = 0; playerIdx < players.length; playerIdx ++) {
                if (players[playerIdx].updates.length > 0) {
                    if (options.interpolation) {



                    } else {
                        maxUpdate = players[playerIdx].updates.length - 1;
                        stateCallback(players[playerIdx].updates[maxUpdate].state);
                    }
                }
            }
            stateCallback(currentState);
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates
    };

}) (window, io);