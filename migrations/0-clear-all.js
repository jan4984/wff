'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * dropTable "workflows"
 * dropTable "instances"
 * dropTable "files"
 * dropTable "operations"
 * dropTable "workflowInstances"
 *
 **/

var info = {
    "revision": 0,
    "name": "clear-all",
    "created": "2019-12-25T09:30:00.693Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: [
                "files",
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: [
                "operations",
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: [
                "instances",
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: [
                "workflowInstances",
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "dropTable",
            params: [
                "workflows",
                {
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [];
};

module.exports = {
    pos: 0,
    useTransaction: true,
    execute: function(queryInterface, Sequelize, _commands)
    {
        var index = this.pos;
        function run(transaction) {
            const commands = _commands(transaction);
            return new Promise(function(resolve, reject) {
                function next() {
                    if (index < commands.length)
                    {
                        let command = commands[index];
                        console.log("[#"+index+"] execute: " + command.fn);
                        index++;
                        queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                    }
                    else
                        resolve();
                }
                next();
            });
        }
        if (this.useTransaction) {
            return queryInterface.sequelize.transaction(run);
        } else {
            return run(null);
        }
    },
    up: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, migrationCommands);
    },
    down: function(queryInterface, Sequelize)
    {
        return this.execute(queryInterface, Sequelize, rollbackCommands);
    },
    info: info
};
