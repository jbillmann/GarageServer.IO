window.GarageServerIO = (function (window, socketio) {
    
    var io = socketio,
    
    garageServerGame = null,
    
    connectToGarageServer = function (path, options) {
        io.connect(path + '/garageserver.io');
        registerSocketEvents();
    },
    
    registerSocketEvents = function () {
        io.on('update', function(data) {
            if(garageServerGame.addPlayerInput) {
                garageServerGame.addPlayerInput(data);
            }
        });
        io.on('ping', function(data) {
            
        });
        io.on('removePlayer', function(id) {
            if(garageServerGame.removePlayer) {
                garageServerGame.removePlayer(id);
            }
        });
    },
    
    startGarageServerGame = function (options) {
        garageServerGame = new GarageServerGame(options);
    };
    
    function GarageServerGame (options) {
        this.players = [];
        this.updates = [];
    }
    
    GarageServerGame.prototype.addPlayerInput = function (input) {
        this.updates.push(input);
    };
    
    GarageServerGame.prototype.sendPlayerInput = function (input) {
        
    };
    
    GarageServerGame.prototype.removePlayer = function (id) {
        for(var i = 0; i < this.players.length; i ++) {
            if(this.players[i].id === id) {
                this.players.splice(i, 1)[0];
                return;
            }
        }
    };
    
    GarageServerGame.prototype.updatePlayers = function () {
        
    };
    
    return {
        connectToGarageServer: connectToGarageServer,
        startGarageServerGame: startGarageServerGame
    };

}) (window, io);