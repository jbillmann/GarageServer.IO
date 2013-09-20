# GarageServer.IO Example
A sample application using GarageServer.IO

### Demo

A playable [demo](http://garageserverio.jit.su/) of this example using GarageServer.IO.

## Install

Change the `path` parameter of `GarageServerIO.initializeGarageServer` that is found in file, `/public/javascripts/game.js`, to point to the URL where your Node app runs.  I.e. `http://127.0.0.1:3000`.  Note that the example app uses a default port of `process.env.PORT || 3000`.  This can be changed in `app.js`.  


Execute `$ npm install` in the `example/` root directory and `$ node app.js` to run the application.

NOTE:  The example has `options.clientSidePrediction` and `options.interpolation` enabled on the server.  If you're running it locally (no ping), you may want to disable these (`false`).