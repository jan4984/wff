const uuid = require('uuid/v4');
const DBService = require('../src/db-service');

const config = {
    host:process.env['DB_HOST'] || 'localhost',
    port:process.env['DB_PORT'] || 5432,
    database:process.env['DB_DATABASE'] || 'test',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || "postgres",
    test: true
};


let db;

describe('db works', ()=>{
    beforeAll(async ()=>{
        db = await DBService.get(config);
    });
    afterAll(async ()=>{
        await DBService.dropAll();
        await db.close();
    });
    it('create user and wfi', async ()=>{
        const wfi = await DBService.models.WFI.create({
            id:uuid()
        });
        expect(wfi).toBeTruthy();

        const user = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        expect(user).toBeTruthy();
        expect(user.id).toBeTruthy();

        await wfi.addUser(user);
        await user.addWorkflowInstance(wfi);
        const wfiAssUsers = await wfi.getUsers();
        expect(wfiAssUsers).toHaveLength(1);
        expect(wfiAssUsers[0].id).toBe(user.id);
        const userAssWfis = await user.getWorkflowInstances();
        expect(userAssWfis).toHaveLength(1);
        expect(userAssWfis[0].id).toBe(wfi.id);

        await wfi.destroy();
        await user.destroy();
    });
    it('add operation', async ()=>{
        const user = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        expect(user).toBeTruthy();
        expect(user.id).toBeTruthy();
        const wfi = await DBService.models.WFI.create({
            id:uuid()
        });
        expect(wfi).toBeTruthy();
        const op = await DBService.models.OP.create({
            workflowServiceTask:'ST_0001',
            operationData: JSON.stringify({comment:'agree',
                fileList:[{
                    name:'myfile',
                    id:'24l12903j123;j12'
                }]}),
            userId:user.id,
            workflowInstanceId:wfi.id,
        });
        expect(op).toBeTruthy();

        let ops = await user.getOperations();
        expect(ops).toHaveLength(1);
        expect(ops[0].id).toBe(op.id);
        ops = await wfi.getOperations();
        expect(ops).toHaveLength(1);
        expect(ops[0].id).toBe(op.id);

        await op.destroy();
        await user.destroy();
        await wfi.destroy();
    });
});
