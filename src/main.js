//const {WorkflowFramework, DBService} = require('../index');
//const WorkflowFramework = require('./workflow-framework');
const readline = require('readline');


const p1 = 'abc';
const p2 = {[p1]: 'dddd'};
const p3 = {lest: 'dsfsdfsd'};
console.log(p2);
console.log(p3);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function preH(instanceKey, type, vars) {
    console.log('in preHandler');
    return true;
}

async function postH(instanceKey, type, vars) {
    console.log('in postHandler');
    return true;
}

const hooks = {
    SERV_testA: {
        preHandler: preH,
        postHandler: postH,
    }
};

let instanceKey;
const framework = new WorkflowFramework(hooks);
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
    await framework.initialize(props);

    // deploy a workflow by passing the path of the bpmn file
    // return an object if successful with definition below
    // {
    //     bpmnProcessId: string
    //     version: number
    //     workflowKey: string
    //     resourceName: string
    // }
    console.log(await framework.deployWorkflow('diagram_2.bpmn'));

    // create a workflow instance with bpmnProcessId
    // return an object if successful with definition below
    // {
    //     workflowKey: string
    //     bpmnProcessId: string
    //     version: number
    //     workflowInstanceKey: string
    // }
    let instance = await framework.createWorkflowInstance('Process_1163b87').catch(e => console.log(e));

    instanceKey = instance.workflowInstanceKey;
})();

rl.on('line', line => {
    console.log('read from stdin:', line);
    if (line.length > 2) {
        framework.addOperation(instanceKey, line, {age: 12, name: 'alice', gender: 'male'});
    }
});