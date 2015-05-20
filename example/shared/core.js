(function(exports){

    exports.getNewPlayerState = function (id, state, inputs, deltaTime, garageServer) {
        var i = 0, distance = 0, newState = {};
        
        if (!state.ang && state.ang !== 0) {
            newState.ang = 0;
            newState.x = 0;
            newState.y = 0;
            newState.ship = Math.floor(Math.random() * 9) + 1;
            newState.lastFire = new Date().getTime();
        }
        else {
            newState.ang = state.ang;
            newState.x = state.x;
            newState.y = state.y;
            newState.ship = state.ship;
            newState.lastFire = state.lastFire;
        }

        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                newState.ang -= (125 * deltaTime);
            } else if (inputs[i].input === 'right') {
                newState.ang += (125 * deltaTime);
            } else if (inputs[i].input === 'up') {
                distance += (125 * deltaTime);
            } else if (inputs[i].input === 'space') {
                if ((new Date().getTime() - newState.lastFire) > 1000) {
                    var newId = guid();
                    garageServer.addEntity(newId, id);
                    garageServer.updateEntityState(newId, { x: newState.x, y: newState.y, ang: newState.ang } );
                    newState.lastFire = new Date().getTime();
                }
            }
        }
        var newPoint = getPoint(newState.ang, distance, newState.x, newState.y);
        newState.x = newPoint.x;
        newState.y = newPoint.y;

        return newState;
    };

    function getPoint(angle, distance, oldX, oldY) {
        var radians = angle * (Math.PI / 180);
        return {
            x: oldX + distance * Math.cos(radians),
            y: oldY + distance * Math.sin(radians)
        };
    }

    exports.getNewEntityState = function (state, deltaTime) {
        var newState = {};
        var distance = 300 * deltaTime;
        var newPoint = getPoint(state.ang, distance, state.x, state.y);
        
        newState.ang = state.ang;
        newState.x = newPoint.x;
        newState.y = newPoint.y;

        return newState;
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