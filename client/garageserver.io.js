/*
options = {
    
}
*/

window.GarageServerIO = (function (window, socketio) {

    var io = socketio,

    socket = null,

    sequenceNumber = 0,

    players = [],

    inputs = [],

    updates = [],

    // TODO: DONE CALLBACK
    connectToGarageServer = function (path, options) {
        socket = io.connect(path + '/garageserver.io');
        registerSocketEvents(options);
    },

    registerSocketEvents = function (options) {
        socket.on('update', function(data) {
            updatePlayerInput(data);
        });
        socket.on('ping', function(data) {
            
        });
        socket.on('removePlayer', function(id) {
            removePlayer(id);
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
        }
        else {
            for (playerIdx = 0; playerIdx < players.length; playerIdx ++) {
                if(players[playerIdx].id === data.id) {
                    playerFound = true;
                    for (updateIdx = 0; updateIdx < players[playerIdx].updates.length; updateIdx ++) {
                        if (players[playerIdx].updates[updateIdx].seq === data.seq) {
                            players[playerIdx].updates[updateIdx].state = data.state;
                            updateFound = true;
                            break;
                        }
                    }
                    if (!updateFound) {
                        players[playerIdx].updates.push( { state: data.state, seq: data.seq } );
                    }
                    break;
                }
            }

            if (!playerFound) {
                var player = {
                    id: data.id,
                    updates: []
                };
                player.updates.push( { state: data.state, seq: data.seq } );
                players.push(player);
            }
        }
    },

    addPlayerInput = function (input) {
        sequenceNumber += 1;
        inputs.push(input);
        sendPlayerInput(input);
    },

    sendPlayerInput = function (input) {
        var currentTime = new Date().getTime();
        socket.emit('input', { input: input, seq: sequenceNumber, timestamp: currentTime });
    },

    removePlayer = function (id) {
        for (var i = 0; i < players.length; i ++) {
            if (players[i].id === id) {
                players.splice(i, 1)[0];
                return;
            }
        }
    };

    return {
        connectToGarageServer: connectToGarageServer,
        addPlayerInput: addPlayerInput
    };

}) (window, io);