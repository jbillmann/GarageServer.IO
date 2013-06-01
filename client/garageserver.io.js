window.GarageServerIO = (function (window, socketio) {
    
    var io = socketio,
    
    socket = null,
    
    sequenceNumber = 0,
    
    players = [],
    
    updates = [],
    
    // TODO: DONE CALLBACK
    connectToGarageServer = function (path, options) {
        socket = io.connect(path + '/garageserver.io');
        registerSocketEvents();
    },
    
    registerSocketEvents = function () {
        socket.on('update', function(data) {
            if(addPlayerInput) {
                addPlayerInput(data);
            }
        });
        socket.on('ping', function(data) {
            
        });
        socket.on('removePlayer', function(id) {
            if(removePlayer) {
                removePlayer(id);
            }
        });
    },
    
    addPlayerInput = function (input) {
        sequenceNumber += 1;
        sendPlayerInput(input);
    },
    
    sendPlayerInput = function (input) {
        socket.emit('input', { input: input, seq: sequenceNumber });
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
        addPlayerInput: addPlayerInput,
        sendPlayerInput: sendPlayerInput
    };

}) (window, io);