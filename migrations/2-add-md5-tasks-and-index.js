'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "lastTasks" to table "instances"
 * addColumn "md5" to table "workflows"
 * addIndex "operations_instance_id" to table "operations"
 * addIndex "workflows_md5" to table "workflows"
 *
 **/

var info = {
    "revision": 2,
    "name": "add-md5-tasks-and-index",
    "created": "2019-12-27T09:15:40.466Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "addColumn",
            params: [
                "instances",
                "lastTasks",
                {
                    "type": Sequelize.JSON,
                    "field": "lastTasks",
                    "defaultValue": Sequelize.Array,
                    "allowNull": false
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addColumn",
            params: [
                "workflows",
                "md5",
                {
                    "type": Sequelize.STRING,
                    "field": "md5",
                    "defaultValue": "",
                    "allowNull": true
                },
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "operations",
                ["instanceId"],
                {
                    "indexName": "operations_instance_id",
                    "name": "operations_instance_id",
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "addIndex",
            params: [
                "workflows",
                ["md5"],
                {
                    "indexName": "workflows_md5",
                    "name": "workflows_md5",
                    "indicesType": "UNIQUE",
                    "type": "UNIQUE",
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "removeIndex",
            params: [
                "operations",
                "operations_instance_id",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeIndex",
            params: [
                "workflows",
                "workflows_md5",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "instances",
                "lastTasks",
                {
                    transaction: transaction
                }
            ]
        },
        {
            fn: "removeColumn",
            params: [
                "workflows",
                "md5",
                {
                    transaction: transaction
                }
            ]
        }
    ];
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
