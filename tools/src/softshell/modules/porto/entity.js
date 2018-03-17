(function (entity){
    var generic = {}; // new soft.Entity();
    entity.using = function (entityName, entityNamespace, entityVersion) {
        A = require('porto.factory')
            .createEntity(entityName,
                          entityNamespace,
                          entityVersion,
                          function(err)
                          {
                              if (err) throw (err);
                          });

        return A.prototype.constructor;
    };                
    
    return entity;
})(exports);
