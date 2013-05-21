window.GarageServerIO = (function (window, socketio) {
    
    var io = socketio,
    
    garageServerGame = null,
    
    connectToGarageServer = function (path, options) {
        io.connect(path + '/garageserver');
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