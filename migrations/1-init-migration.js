'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "workflows", deps: []
 * createTable "instances", deps: [workflows]
 * createTable "files", deps: [instances]
 * createTable "operations", deps: [instances]
 *
 **/

var info = {
    "revision": 1,
    "name": "init-migration",
    "created": "2019-12-25T09:30:01.693Z",
    "comment": ""
};

var migrationCommands = function(transaction) {
    return [{
            fn: "createTable",
            params: [
                "workflows",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "content": {
                        "type": Sequelize.TEXT,
                        "field": "content",
                        "allowNull": false
                    },
                    "default": {
                        "type": Sequelize.BOOLEAN,
                        "field": "default",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "status": {
                        "type": Sequelize.STRING,
                        "field": "status",
                        "defaultValue": "normal",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "instances",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true
                    },
                    "variables": {
                        "type": Sequelize.JSON,
                        "field": "variables",
                        "defaultValue": Sequelize.Object,
                        "allowNull": false
                    },
                    "status": {
                        "type": Sequelize.STRING,
                        "field": "status",
                        "defaultValue": "processing",
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "workflowId": {
                        "type": Sequelize.INTEGER,
                        "field": "workflowId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "workflows",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "files",
                {
                    "id": {
                        "type": Sequelize.STRING,
                        "field": "id",
                        "primaryKey": true
                    },
                    "attached": {
                        "type": Sequelize.BOOLEAN,
                        "field": "attached",
                        "defaultValue": false,
                        "allowNull": false
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "instanceId": {
                        "type": Sequelize.STRING,
                        "field": "instanceId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "instances",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        },
        {
            fn: "createTable",
            params: [
                "operations",
                {
                    "id": {
                        "type": Sequelize.INTEGER,
                        "field": "id",
                        "autoIncrement": true,
                        "primaryKey": true,
                        "allowNull": false
                    },
                    "name": {
                        "type": Sequelize.STRING,
                        "field": "name",
                        "allowNull": false
                    },
                    "data": {
                        "type": Sequelize.JSON,
                        "field": "data",
                        "defaultValue": Sequelize.Object,
                        "allowNull": false
                    },
                    "files": {
                        "type": Sequelize.JSON,
                        "field": "files",
                        "defaultValue": Sequelize.Array,
                        "allowNull": true
                    },
                    "createdAt": {
                        "type": Sequelize.DATE,
                        "field": "createdAt",
                        "allowNull": false
                    },
                    "updatedAt": {
                        "type": Sequelize.DATE,
                        "field": "updatedAt",
                        "allowNull": false
                    },
                    "instanceId": {
                        "type": Sequelize.STRING,
                        "field": "instanceId",
                        "onUpdate": "CASCADE",
                        "onDelete": "SET NULL",
                        "references": {
                            "model": "instances",
                            "key": "id"
                        },
                        "allowNull": true
                    }
                },
                {
                    "transaction": transaction
                }
            ]
        }
    ];
};
var rollbackCommands = function(transaction) {
    return [{
            fn: "dropTable",
            params: ["files", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["instances", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["operations", {
                transaction: transaction
            }]
        },
        {
            fn: "dropTable",
            params: ["workflows", {
                transaction: transaction
            }]
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
