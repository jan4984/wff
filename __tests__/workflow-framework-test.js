const WorkflowFramework = require('../src/workflow-framework');
const DBService = require('../src/db-service');
const uuid = require('uuid/v4');

const dbConfig = {
    host:process.env['DB_HOST'] || 'localhost',
    port:process.env['DB_PORT'] || 5432,
    database:process.env['DB_DATABASE'] || 'test',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || "postgres",
    test: false
};

const wff = new WorkflowFramework();

describe('__tests__ workflow framework', ()=> {
    beforeAll(async () => {
        await DBService.get(dbConfig);
        await wff.initialize();
    });

    it('deploy workflow test', async ()=> {
        const result = await wff.deployWorkflow('d:/test.bpmn');
        expect(result).toBeTruthy();
        console.log('new workflow', result);

        const result2 = await wff.deployWorkflow('d:/test.bpmn');
        expect(result).toEqual(result2);
    });

    it('create workflow instance test', async ()=> {
        await wff.createWorkflowInstance(1000, {cpu: 'amd'})
            .catch(e => {
                if (e.toString() !== 'not find workflow with id 1000') {
                    throw e;
                }
            });

        var vars = {cpu: 'amd'};
        const result = await wff.createWorkflowInstance(1, vars);
        expect(result).toBeTruthy();
        const verify = await DBService.models.WFI.findOne({where: {id: result}});
        expect(verify.variables).toEqual(vars);
    });

    it('flow test', async ()=> {

    })
});
