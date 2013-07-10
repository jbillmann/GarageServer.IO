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
            }
        }
        return state;
    };
    
    exports.onUpdateEntityPhysics = function (id, state, deltaTime) {
        if (!state.x && !state.y) {
           state.x = 0;
           state.y = 0;
        }
        state.x += (10 * deltaTime);
    };

})(typeof exports === 'undefined' ? window : exports);