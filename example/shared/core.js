(function(exports){

    exports.getNewPlayerState = function (state, inputs, deltaTime, garageServer) {
        var i = 0, distance = 0;

        if (!state.ang && state.ang !== 0) {
           state.ang = 0;
           state.x = 0;
           state.y = 0;
           state.ship = Math.floor(Math.random() * 9) + 1;
           state.lastFire = new Date().getTime();
        }

        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                state.ang -= (125 * deltaTime);
            } else if (inputs[i].input === 'right') {
                state.ang += (125 * deltaTime);
            } else if (inputs[i].input === 'up') {
                distance += (125 * deltaTime);
            } else if (inputs[i].input === 'space') {
                if (garageServer && (new Date().getTime() - state.lastFire) > 1000) {
                    var newId = guid();
                    garageServer.addEntity(newId);
                    garageServer.updateEntityState(newId, { x: state.x, y: state.y, ang: state.ang } );
                    state.lastFire = new Date().getTime();
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
        var distance = 300 * deltaTime;
        var newPoint = getPoint(state.ang, distance, state.x, state.y);
        state.x = newPoint.x;
        state.y = newPoint.y;

        return state;
    };

    exports.getInterpolatedState = function (previousState, targetState, amount) {
        var interpolationState = {};
        interpolationState.x = (previousState.x + amount * (targetState.x - previousState.x));
        interpolationState.y = (previousState.y + amount * (targetState.y - previousState.y));
        interpolationState.ang = (previousState.ang + amount * (targetState.ang - previousState.ang));
        interpolationState.ship = targetState.ship;
        return interpolationState;
    };

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    function guid() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

})(typeof exports === 'undefined' ? window.GamePhysics = {} : exports);