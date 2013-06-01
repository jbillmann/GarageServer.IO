window.GarageServerIO = (function (window, socketio) {

    var io = socketio,

    socket = null,

    sequenceNumber = 1,

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
        var playerFound = false;

        if(socket.id === data.id) {
            updates.push(data);
        }
        else {
            for(var i = 0; i < players.length; i ++) {
                if(players[i].id === data.id) {
                    playerFound = true;
                    players[i].state = data.state;
                    players[i].seq = data.seq;
                }
            }

            if(!playerFound) {
                var player = {
                    id: data.id,
                    state: data.state,
                    seq: data.seq
                };
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
        for(var i = 0; i < players.length; i ++) {
            if(players[i].id === id) {
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