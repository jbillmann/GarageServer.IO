/*
options = {
    onConnect: function()
    onPlayerUpdate: function (data),
    onPlayerDisconnect: function (id),
    onPing: function (data),
    logging: true,
    clientSidePrediction: true,
    onUpdatePhysics: function (state, inputs)
}
*/

window.GarageServerIO = (function (window, socketio) {

    var io = socketio,
        socket = null,
        sequenceNumber = 0,
        processedSequenceNumber = 0,
        players = [],
        inputs = [],
        updates = [],
        options = null,

        // TODO: DONE CALLBACK
        connectToGarageServer = function (path, opts) {
            socket = io.connect(path + '/garageserver.io');
            options = opts;
            registerSocketEvents();
        },

        registerSocketEvents = function () {
            socket.on('update', function(data) {
                updatePlayerInput(data);
                if (options.logging) {
                    console.log('garageserver.io:: socket update ' + data);
                }
            });
            socket.on('ping', function(data) {
                if (options.logging) {
                    console.log('garageserver.io:: socket ping ' + data);
                }
            });
            socket.on('removePlayer', function(id) {
                removePlayer(id);
                if (options.logging) {
                    console.log('garageserver.io:: socket removePlayer ' + id);
                }
            });
        },

        updatePlayerInput = function (data) {
            var playerFound = false,
                updateFound = false,
                playerIdx = 0,
                updateIdx = 0;

            if (socket.socket.sessionid === data.id) {
                for (updateIdx = 0; updateIdx < updates.length; updateIdx ++) {
                    if (updates[updateIdx].seq === data.seq) {
                        updates[updateIdx].state = data.state;
                        updateFound = true;
                        break;
                    }
                }
                if (!updateFound) {
                    updates.push(data);
                }
                if (options.clientSidePrediction) {
                    for (updateIdx = 0; updateIdx < updates.length; updateIdx ++) {
                        if (updates[updateIdx].seq == processedSequenceNumber) {
                            updates.splice(0, updateIdx);
                        }
                    }
                    for (updateIdx = 0; updateIdx < inputs.length; updateIdx ++) {
                        if (inputs[updateIdx].seq == processedSequenceNumber) {
                            inputs.splice(0, updateIdx + 1);
                        }
                    }
                    if (updates.length > 0 && inputs.length > 0) {
                        options.onUpdatePhysics(updates[0].state, inputs);
                    }
                }
            } else {
                for (playerIdx = 0; playerIdx < players.length; playerIdx ++) {
                    if (players[playerIdx].id === data.id) {
                        playerFound = true;
                        for (updateIdx = 0; updateIdx < players[playerIdx].updates.length; updateIdx ++) {
                            if (players[playerIdx].updates[updateIdx].seq === data.seq) {
                                players[playerIdx].updates[updateIdx].state = data.state;
                                updateFound = true;
                                break;
                            }
                        }
                        if (!updateFound) {
                            players[playerIdx].updates.push({ state: data.state, seq: data.seq });
                        }
                        break;
                    }
                }

                if (!playerFound) {
                    var player = {
                        id: data.id,
                        updates: []
                    };
                    player.updates.push({ state: data.state, seq: data.seq });
                    players.push(player);
                }
            }

            if (options.onPlayerUpdate) {
                options.onPlayerUpdate(data);
            }
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
            var currentState = {},
                newState = {},
                inputsToProcess = [];

            if (options.clientSidePrediction) {
                for (var i = 0; i < updates.length; i ++) {
                    if (updates[i].seq == processedSequenceNumber) {
                        currentState = updates[i].state;
                    }
                }
            }

            sequenceNumber += 1;
            inputs.push({ input: clientInput, seq: sequenceNumber });

            if (options.clientSidePrediction && options.onUpdatePhysics) {
                inputsToProcess.push({ input: clientInput });
                newState = options.onUpdatePhysics(currentState, inputsToProcess);
                processedSequenceNumber += 1;
                updates.push({ state: newState, seq: processedSequenceNumber });
            }
            sendPlayerInput(clientInput);
        },

        sendPlayerInput = function (clientInput) {
            var currentTime = new Date().getTime();
            socket.emit('input', { input: clientInput, seq: sequenceNumber, timestamp: currentTime });
        },

        getPlayerStates = function (stateCallback) {
            var maxUpdate = 0;
            for (var i = 0; i < players.length; i ++) {
                if (players[i].updates.length > 0) {
                    maxUpdate = players[i].updates.length - 1;
                    stateCallback(players[i].updates[maxUpdate].state);
                }
            }
            if (updates.length > 0) {
                maxUpdate = updates.length - 1;
                stateCallback(updates[maxUpdate].state);
            }
        };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput,
        getPlayerStates: getPlayerStates
    };

}) (window, io);