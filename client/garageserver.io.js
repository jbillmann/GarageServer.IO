window.GarageServerIO = (function (window, socketio) {
    
    var io = socketio,
    
    garageServerGame = null,
    
    connectToGarageServer = function (path, options) {
        io.connect(path + '/garageserver.io');
        registerSocketEvents();
    },
    
    registerSocketEvents = function () {
        io.on('update', function(data) {
        
        });
        io.on('ping', function(data) {
            
        });
    },
    
    startGarageServerGame = function (options) {
        garageServerGame = new GarageServerGame(options);
    };
    
    function GarageServerGame (options) {
    
    }
    
    GarageServerGame.prototype.update = function () {
        
    };
    
    return {
        connectToGarageServer: connectToGarageServer
    };

}) (window, io);