const CAEFrameWork = require('./cae-workflow');
const DBService = require('./db-service');
const { Sequelize, Model, QueryTypes, DataTypes } = require('sequelize');

let instanceKey;
const caeFramework = new CAEFrameWork();
(async () => {
    const props = {
        zbInfo: 'localhost:26500',
        dbInfo: {
            host: process.env['DB_HOST'] || 'localhost',
            port: process.env['DB_PORT'] || 5432,
            database: process.env['DB_DATABASE'] || 'test',
            username: process.env['DB_USER'] || 'postgres',
            password: process.env['DB_PASSWORD'] || "postgres",
            test: true
        }
    };

    // initialize zeebe&db connection
    await caeFramework.initialize(props);

    // deploy a workflow by passing the path of the bpmn file
    // return an object if successful with definition below
    // {
    //     bpmnProcessId: string
    //     version: number
    //     workflowKey: string
    //     resourceName: string
    // }
    console.log(await caeFramework.deployWorkflow('diagram_2.bpmn'));

    // create a workflow instance with bpmnProcessId
    // return an object if successful with definition below
    // {
    //     workflowKey: string
    //     bpmnProcessId: string
    //     version: number
    //     workflowInstanceKey: string
    // }
    let instance = await caeFramework.createWorkflowInstance('Process_1163b87').catch(e => console.log());

    instanceKey = instance.workflowInstanceKey;

    // post request from client should be transmitted to addOperation function
    // addOperation will publish a message to zeebe with process name as message name
    await caeFramework.addOperation(instanceKey, 'changeUserInfo', {
        name: 'abc',
        age: 16,
        gender: 'male'
    }, [10, 11, 12]);
})();
