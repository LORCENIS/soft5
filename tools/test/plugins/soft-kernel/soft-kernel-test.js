#!/usr/bin/env softshell

if(!Array.prototype.equals) Array.prototype.equals = function (array) {
    if (this.length != array.length) return false;
    for (var i = 0; i < array.length; ++i) {
        if (this[i] != array[i]) return false;
    }
    return true;
};

readEntities = {
    name: "soft-kernel-test",
    create_reaction: function() {
	// Write a set of reactants to the output file
	var reactants = ["C", "O"];
	try {
	    SimpleReaction = require('porto.entity').using('simpleReaction', 'http://www.sintef.no/soft5/schema', '1');
	} catch (err) {
	    console.error (err.name + ":" + err.message);
	    console.error ("Please ensure that MongoDB is currenly running and that the entity is registered with the 'soft-register-entity' tool");
	}
	var uuid = "";
	try {	    
	    var storage = require('porto.storage').createStorage('json', 'output-test.json');

	    var reaction = new SimpleReaction();
            reaction.dim.nreactants = 2;
	    reaction.setReactants(reactants);
	    uuid = reaction.id();
	    storage.save(reaction);	    
	    
	} catch (err) {
	    qFail(err);
	}

	// Read back the set of reactants from the output file and compare with
	// the original.
	try {
	    var readStorage = require('porto.storage')
		    .createStorage('json', 'output-test.json');
	    var readReaction = new SimpleReaction(uuid);
	    qCompare(uuid, readReaction.id());
	    storage.load(readReaction);
	    var reacts = readReaction.getReactants();
	    qCompare(readReaction.getReactants(), reactants, function(xs, ys){
		return xs.equals(ys);
	    });
	} catch (err) {
	    qFail(err);
	}
    },

    property_based: function() {
        var uuid = "";
        try {
            SimpleReaction = require('porto.entity').using('simpleReaction', 'http://www.sintef.no/soft5/schema', '1');
            var storage = require('porto.storage').createStorage('json', 'reactant-test.json');
            var reaction = new SimpleReaction();
            uuid = reaction.id();
            reaction.dim.nreactants = 3;
            reaction.reactants = ["A", "B", "C"];
            reaction.setAll();
            storage.save(reaction);
        } catch (err) {
            qFail(err);
        }

        try {
            var readReaction = new SimpleReaction(uuid);
            storage.load(readReaction);
            readReaction.getAll();
            qCompare(readReaction.dim.nreactants, 3);           

        } catch (err) {
            qFail(err);
        }
    }
};

__main__ = function (args)
{
    try {
	QTest = require('utils.qstestlib');
	if (args.length > 1 && args[1] == "--xml")
	    QTest.logger = QTest.xmlLogger;
	return (QTest.exec(readEntities) == true ? 0 : 1);
    } catch (err) {
	console.error(err);
	return 1;
    } 
};
