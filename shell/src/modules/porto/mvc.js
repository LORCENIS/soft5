expand = require(":/res/macro.js").expand;

MVC = function(){}

MVC.create = function(obj)  {
    if( obj.model === undefined )
	throw ("Missing model in object");
    
    if( obj.view === undefined )
	throw ("Missing view in object");
  
    return {
	generate: function(){
	    var view = readFile(obj.view);
	    if (view == undefined)
		throw ("Illegal file", obj.view);

	    if( typeof obj.model == 'object' ) {
		porto.model = obj.model;
	    }
	    else {
		var json = readFile(obj.model);
		if (json == undefined)
		    throw ("Illegal file", obj.model);
		
		porto.model = JSON.parse(json);
	    }
	    return expand(view);
	}};
};

exports = MVC;