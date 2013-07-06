var Entity = require('../entities/entity');

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
            newEntity = new Entity(id);
            this.entities.push(newEntity);
        }
        return newEntity;
    },
    remove: function (id) {
        
    }
};