(function(exports){

    exports.getNewPlayerState = function (state, inputs, deltaTime, garageServer) {
        var i = 0,
            distance = 0;

        if (!state.ang && state.ang !== 0) {
           state.ang = 0;
           state.x = 0;
           state.y = 0;
        }

        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                state.ang -= (125 * deltaTime);
            } else if (inputs[i].input === 'right') {
                state.ang += (125 * deltaTime);
            } else if (inputs[i].input === 'up') {
                distance += (125 * deltaTime);
            } else if (inputs[i].input === 'space') {
                if (garageServer) {
                    var newId = guid();
                    garageServer.addEntity(newId);
                    garageServer.updateEntityState(newId, { x: state.x + 5, y: state.y + 5, direction: state.direction } );
                }
            }
        }
        var newPoint = getPoint(state.ang, distance, state.x, state.y);
        state.x = newPoint.x;
        state.y = newPoint.y;

        return state;
    };
    
    function getPoint(angle, distance, oldX, oldY) {
        var radians = angle * (Math.PI / 180);
        return {
            x: oldX + distance * Math.cos(radians),
            y: oldY + distance * Math.sin(radians)
        };
    }

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
        interpolationState.ang = (previousState.ang + amount * (targetState.ang - previousState.ang));
        return interpolationState;
    };

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

})(typeof exports === 'undefined' ? window.GamePhysics = {} : exports);