(function(exports){

    exports.getNewPlayerState = function (state, inputs, deltaTime) {
       var i = 0;

        if (!state.x && !state.y) {
           state.x = 0;
           state.y = 0;
        }
        for (i = 0; i < inputs.length; i ++) {
            if (inputs[i].input === 'left') {
                state.x -= (50 * deltaTime);
            } else if (inputs[i].input === 'right') {
                state.x += (50 * deltaTime);
            } else if (inputs[i].input === 'down') {
                state.y += (50 * deltaTime);
            } else if (inputs[i].input === 'up') {
                state.y -= (50 * deltaTime);
            } else if (inputs[i].input === 'space') {

            }
        }
        return state;
    };

    exports.getNewEntityState = function (state, deltaTime) {
        
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