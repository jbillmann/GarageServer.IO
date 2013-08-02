(function(exports){

    exports.getNewPlayerState = function (state, inputs, deltaTime, garageServer) {
       var i = 0;

        if (!state.x && !state.y) {
           state.x = 0;
           state.y = 0;
           state.direction = 'right';
        }
        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                state.x -= (125 * deltaTime);
                state.direction = 'left';
            } else if (inputs[i].input === 'right') {
                state.x += (125 * deltaTime);
                state.direction = 'right';
            } else if (inputs[i].input === 'down') {
                state.y += (125 * deltaTime);
                state.direction = 'down';
            } else if (inputs[i].input === 'up') {
                state.y -= (125 * deltaTime);
                state.direction = 'up';
            } else if (inputs[i].input === 'space') {
                if (garageServer) {
                    var newId = guid();
                    garageServer.addEntity(newId);
                    garageServer.updateEntityState(newId, { x: state.x + 5, y: state.y + 5, direction: state.direction } );
                }
            }
        }
        return state;
    };

    exports.getNewEntityState = function (state, deltaTime) {
        if (state.direction === 'left') {
            state.x -= (300 * deltaTime);
        } else if (state.direction === 'right') {
            state.x += (300 * deltaTime);
        } else if (state.direction === 'down') {
            state.y += (300 * deltaTime);
        } else if (state.direction === 'up') {
            state.y -= (300 * deltaTime);
        }

        return state;
    };

    exports.getInterpolatedState = function (previousState, targetState, amount) {
        var interpolationState = {};
        interpolationState.x = (previousState.x + amount * (targetState.x - previousState.x));
        interpolationState.y = (previousState.y + amount * (targetState.y - previousState.y));
        return interpolationState;
    };

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

})(typeof exports === 'undefined' ? window.GamePhysics = {} : exports);