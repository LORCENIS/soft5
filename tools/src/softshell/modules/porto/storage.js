(function (storageFactory){
    storageFactory.createStorage = function(driver, uri, opts) {
        this.storage = new soft.Storage(driver, uri, opts);

        this.save = function(entity) {
            return this.storage.save(entity.__proto__);
        };

        this.load = function(entity) {
            return this.storage.load(entity.__proto__);
        };

        return this;
    };
    return storageFactory;
})(exports);
