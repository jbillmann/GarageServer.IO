window.GarageServerIO = (function (socketio) {
    
    var io = socketio,
    
    connectToGarageServer = function (path) {
        io.connect(path + '/garageserver');
    };
    
    return {
        connectToGarageServer: connectToGarageServer
    };

}) (io);