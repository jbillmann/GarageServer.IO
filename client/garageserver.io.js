window.GarageServerIO = (function (socketio) {
    
    this.io = socketio;
    
    var connectGarageServer = function (path) {
        this.io.connect(path + '/garageserver');
    };
    
    return {
        connectGarageServer: connectGarageServer
    };

}) (io);