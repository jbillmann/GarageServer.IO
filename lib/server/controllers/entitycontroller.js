var entity = require('../entities/entity');

exports = module.exports = EntityController;

function EntityController () {
    this.entities = [];
}

EntityController.prototype = {
    add: function (id) {
        var newEntity, entityFound = false;

        this.entities.some(function (entity) {
            if (entity.id === id) {
                newEntity = entity;
                entityFound = true;
                return true;
            }
        });

        if (!entityFound) {
            newEntity = new entity(id);
            this.entities.push(newEntity);
        }
        return newEntity;
    },
    remove: function (id) {
        for (var i = 0; i < this.entities.length; i ++) {
            if (this.entities[i].id === id) {
                this.entities.splice(i, 1)[0];
                return;
            }
        }
    },
    setState: function (id, state) {
        this.entities.some(function (entity) {
            if (entity.client.id === id) {
                entity.state = state;
                return true;
            }
        });
    }
};