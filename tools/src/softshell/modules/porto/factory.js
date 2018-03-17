function DatabaseException(message) {
    this.message = message;
    this.name = 'DatabaseException';
}

function quote( str ) {
    return str.replace(/\n/g,'\\n').replace(/\"/g,'\\\"').replace(/\'/g,'\\\'');
}

(function (entityfactory){   
    var META_DATABASE = 'meta',
        META_COLLECTION = 'entities';

    entityfactory.createEntity = function(entityName, entityNamespace, entityVersion, callback) {
        var mclient = MongoClient();
        var coll    = mclient.collection(META_DATABASE, META_COLLECTION);
        var cursor  = coll.find({
            name: entityName,
            version: entityVersion,
            namespace: entityNamespace
        });
        
        var bson = cursor.next();
        if (bson == undefined) {
            var errormsg = '[ERROR] cannot find entity ' + entityName+':'+entityVersion+' in database';
            if (isFunction(callback)) {
                callback(errormsg);             
            } else {
                console.error(errormsg);
            }
            throw new DatabaseException(errormsg);
            return undefined;
        }
        
        var obj = JSON.parse(bson.asString());
        obj["_id"] = undefined;
        var schema = JSON.stringify(obj);
        var def = "(function(){function b(id){";
        def += "if (id !== undefined && id != null && id.length > 0) {this.setId(id);}";
        def += "this.dim = {};";
        obj.properties.forEach (function (property){
            if(property.dims != undefined) {
                def += "this."+property.name+"=[];";
            }});
        
        def += "this.setSchema(\"" + quote(schema)+ "\");";
        obj.dimensions.forEach (function (dimension) {
            var dname = dimension.name.charAt(0).toUpperCase() + dimension.name.slice(1),
                setter = "set" + dname,
                getter = "get" + dname;
            def += "this.dim." + setter + " = function(a) {this.setDimension('"+dimension.name+"',a);};" +
                "this.dim." + getter + " = function() {return this.dimension('"+dimension.name+"');};";       
        });

        
        obj.properties.forEach (function (property) {
            var pname = property.name.charAt(0).toUpperCase() + property.name.slice(1),
                setter = "set" + pname,
                getter = "get" + pname;
            def += "this." + setter + " = function(a) {this.setProperty('"+property.name+"',a);};" +
                "this." + getter + " = function() {return this.property('"+property.name+"');};";       
        });

        var sets = [];
        var gets = [];
        obj.dimensions.forEach (function (dimension) {
            var setline = "this.setDimension('"+dimension.name+"', this.dim."+dimension.name+");";
            var getline = "this.dim." + dimension.name+"= this.dimension('"+dimension.name+"');";
            sets.push(setline);
            gets.push(getline);
        });
       
        obj.properties.forEach (function (property) {
            var setline = "this.setProperty('"+property.name+"', this."+property.name+");";
            var getline = "this." + property.name+"= this.property('"+property.name+"');";
            sets.push(setline);
            gets.push(getline);
        });

        def += "this.setAll=function(){"+sets.join("")+"};";
        def += "this.getAll=function(){"+gets.join("")+"};";
        def += "}";
        def += "b.prototype = new soft.Entity;";
        def += "b.prototype.constructor=b;";
        def += "return b.prototype.constructor;})();";
        return eval(def);
    };
    return entityfactory;
})(exports);
