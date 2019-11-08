const uuid = require('uuid/v4');
const Srv = require('../src/op-history-service');
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
let wfi1;
let wfi2;
let user1;
let user2;
let user1Id;
let user2Id;
let wfi1Id = uuid();
let wfi2Id = uuid();
let srv = new Srv.OperationHistoryService();

describe('operation history service works', ()=>{
    beforeAll(async ()=>{
        db = await DBService.get(config);
        wfi1 = await DBService.models.WFI.create({
            id:wfi1Id
        });
        wfi2 = await DBService.models.WFI.create({
            id:wfi2Id
        });
        user1 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user1Id = user1.id;
        user2 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user2Id = user2.id;
    });
    afterAll(async ()=>{
        await db.close();
    });

    it('add query', async ()=>{
        const op1 = await DBService.models.OP.create({
            workflowServiceTask:'ST_0001',
            operationData:JSON.stringify({text:"hello"}),
            userId: user1Id,
            workflowInstanceId: wfi1Id
        });
        const op2 = await DBService.models.OP.create({
            workflowServiceTask:'ST_0002',
            operationData:JSON.stringify({text:"hello"}),
            userId: user2Id,
            workflowInstanceId: wfi2Id
        });
        const op3 = await DBService.models.OP.create({
            workflowServiceTask:'ST_0002',
            operationData:JSON.stringify({text:"hello"}),
            userId: user1Id,
            workflowInstanceId: wfi2Id
        });
        const op4 = await DBService.models.OP.create({
            workflowServiceTask:'ST_0002',
            operationData:JSON.stringify({text:"hello"}),
            userId: user2Id,
            workflowInstanceId: wfi1Id
        });

        const user1Ops = await srv.findOperationByUserId(user1Id);
        expect(user1Ops).toHaveLength(2);
        expect(user1Ops[0].id).toEqual(op3.id);
        expect(user1Ops[1].id).toEqual(op1.id);

        const wfi2Ops = await srv.findOperationByWorkflowId(wfi2Id);
        expect(wfi2Ops).toHaveLength(2);
        expect(wfi2Ops[0].id).toEqual(op3.id);
        expect(wfi2Ops[1].id).toEqual(op2.id);

        const user1wfi2Ops = await srv.findOperationByWorkflowId(wfi2Id,  user1Id);
        expect(user1wfi2Ops).toHaveLength(1);
        expect(user1wfi2Ops[0].id).toEqual(op3.id);

        for (const i of [op1, op2, op3, op4]) {
            await i.destroy();
        }
    });
});