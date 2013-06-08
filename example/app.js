
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    io = require('socket.io'),
    garageServer = require('../lib/server/garageserver.io');

var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 2121);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, '..', 'client')));
});

app.configure('development', function () {
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

var sockets = io.listen(server);

sockets.set('log level', 0);

garageServer.createGarageServer(sockets,{
    logging: true,
    onUpdatePhysics: function (state, inputs) {
        var i = 0;
        if (!state.x && !state.y) {
            state.x = 0;
            state.y = 0;
        }
        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                state.x -= 1;
            } else if (inputs[i].input === 'right') {
                state.x += 1;
            } else if (inputs[i].input === 'down') {
                state.y += 1;
            } else if (inputs[i].input === 'up') {
                state.y -= 1;
            }
        }
        return state;
    }
});
