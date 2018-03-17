#!/usr/bin/env softshell
var entity = require('porto.entity');
porto.PhenomInput = entity.using('phenom-input', 'eu.nanosim.phenom', '1');

var println = function (args) {
    console.raw(JSON.stringify(args, null, 2) + "\n");
};

var arraySpan = function (A) {
    return "[" + A.join(" ") + "]";
};

var table = function (A, i, j) {
    var indent = "      ";
    return arraySpan(A.map(function(a) { return indent + a.join(" ") + "\n";} ));
};

has = function (a, v) {
    for (i in a) {
        if (a[i] === v)
            return i;
    }
    return false;
};

__main__ = function (args) {
    if (args.length <= 1) {
        print("Usage: ", args[0], "<UUID>");
        print("Builds a matlab/phenom input file. Assumes that the UUID is a valid data point in a SOFT/JSON storage 'phenom-data.json'.");
        return 1;
    }
    try {
        uuid = args[1];
        var storage = require('porto.storage').createStorage('json', 'phenom-data.json');        
        entity = new porto.PhenomInput(uuid);
        print (entity.id());
        storage.load(entity);
        entity.getAll();

        var controller = require('soft.mvc').create({
            model: entity,
            view: "./templates/phenom-input.m.js"
        });
        console.raw(controller());
    } catch (err) {
        console.raw("failed with" + err);
    }

    return 0;
};
