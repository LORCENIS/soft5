#!/usr/bin/env softshell
var entity = require('porto.entity');
porto.EffectivenessFactor = entity.using('effectivenessfactor', 'eu.nanosim.parscale', '0.2');
porto.EffectiveReactionparameters = entity.using('effectivereactionparameters', 'eu.nanosim.parscale', '0.2');
porto.ChemkinReaction = entity.using('chemkinReaction', 'eu.nanosim.vasp', '0.1');

var print = function(x) {
    console.raw(JSON.stringify(x, null, 2));
}


__main__ = function (args) {
    try {
        // Check that the user provides sufficient arguments to the program
        if (args.length < 2) {
            print("Usage " + args[0] + " <uuid>");
            return;
        }

        var uuid = args[1];

        // Attempt to talk to the local mongodb
        var storage = new porto.Storage("mongo2", "mongodb://localhost", "db=porto;coll=demo");

        // Load the collection given by the uuid on the command line, then retrieve all
        // reaction entities in this collection
        collection = new porto.Collection(uuid);
        storage.load(collection);

        var effectivenessfactorID = collection.findRelations("Effectivenessfactor", "id");
        var effectivereactionparametersID = collection.findRelations("Effectivereactionparameters", "id");

        var reactionDataIds = collection.findRelations("reactiondata", "has-id");

        var ef = new porto.EffectivenessFactor(effectivenessfactorID);
        ef.read(storage);

        if (ef.arguments.length != 0 || ef.parameters.length != 1 || ef.functionalForm != "constant") {
            print(ef);
            throw "I do not understand any other functional forms for the effectiveness factor than the constant form.";
        }

        var erp = new porto.EffectiveReactionparameters(effectivereactionparametersID);
        erp.read(storage);
        
        reactionDataIds.forEach(function (reactionId) {
            var reaction = new porto.ChemkinReaction(reactionId);
            reaction.read(storage);

            console.raw("/* ---[ GENERATED UDF ]------------------------------------------------------ */\n");
            console.raw("/* Collection uuid: " + collection.id() + " */ \n");
            console.raw("/* effectivenessfactorID: " + effectivenessfactorID + " */\n");
            console.raw("/* effectivereactionparametersID: " + effectivereactionparametersID + " */\n");
            console.raw("/* ChemkinReactionID: " + reactionId + "*/\n");

            // Pass the aggregated information from the entity to the code generator (soft.mvc). The
            // variables here (elements, species, reactions) can be found in the template specified
            // below. This will substitute the template entrires such as @{elements} with the contents
            // specified below.
            var controller = require('soft.mvc').create({
                model: {
                    k0: reaction.A / 10e6,
                    EA: reaction.Ea * 10e3,
                    eff: ef.parameters[0]
                },
                view: "./template/effectiveness-udf.cjs"
            });

            // Output the generated code directly to the console.
            // TODO: Add capability to write it to a named file instead.
            console.raw(controller());
        }); 

    } catch (err) {
        // Any error caught during execution is logged to the console.
        console.raw("ERROR: Failed generating code.\nReason: " + err + "\n");
    }

};
