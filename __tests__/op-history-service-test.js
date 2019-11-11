const uuid = require('uuid/v4');
const {Readable} = require('stream');
const Srv = require('../src/op-history-service');
const DBService = require('../src/db-service');
const FileService = require('../src/file-service');

const config = {
    host:process.env['DB_HOST'] || 'localhost',
    port:process.env['DB_PORT'] || 5432,
    database:process.env['DB_DATABASE'] || 'test',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || "postgres",
    test: true
};

const FSConfig = {
    endPoint:process.env['MINIO_HOST'] || '192.168.1.125',
    port:process.env['MINIO_PORT'] || 9000,
    bucketName:process.env['MINIO_TEST_BUCKET'] || 'test',
    accessKey: process.env['MINIO_ACCESS_KEY'] || 'ACCESS_KEY',
    secretKey: process.env['MINIO_SECRET_KEY'] || "SECRET_KEY",
};

let db;
let wfi1;
let wfi2;
let wfi3;
let user1;
let user2;
let user3;
let user4;
let user1Id;
let user2Id;
let user3Id;
let user4Id;
const wfi1Id = uuid();
const wfi2Id = uuid();
const wfi3Id = uuid();
const srv = new Srv.OperationHistoryService();
let fileId = uuid();
let fileId1 = uuid();
let FS;

describe('operation history service works', ()=>{
    beforeAll(async ()=>{
        db = await DBService.get(config);
        wfi1 = await DBService.models.WFI.create({
            id:wfi1Id
        });
        wfi2 = await DBService.models.WFI.create({
            id:wfi2Id
        });
        wfi3 = await DBService.models.WFI.create({
            id:wfi3Id
        });
        user1 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user1Id = user1.id;
        user2 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user2Id = user2.id;
        user3 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user3Id = user3.id;
        user4 = await DBService.models.User.create({
            name:'user name', authType:'test'
        });
        user4Id = user4.id;

        FS = await  FileService.get(FSConfig);
        fileId = await FS.upload('file name',  new Readable({
            read(size) {
                this.push(null);//empty stream
            }
        }), wfi3Id);
        expect(fileId).toBeTruthy();

        fileId1 = await FS.upload('file name2',  new Readable({
            read(size) {
                this.push(null);//empty stream
            }
        }), wfi3Id);
        expect(fileId1).toBeTruthy();
    });
    afterAll(async ()=>{
        await FS.del(fileId);
        await db.close();
    });

    it('add operations with one file', async() =>{
        const op = await srv.addOperation("ST_001", [fileId], {operationData:'hello'}, user3Id, wfi3Id);
        expect(op).toBeTruthy();
        expect(op.id).toBeTruthy();
        expect(op.workflowServiceTask).toEqual('ST_001');

        const op1 = await DBService.models.OP.findByPk(op.id);
        expect(op1).toBeTruthy();
        expect(op1.id).toEqual(op.id);
        expect(op1.workflowServiceTask).toEqual('ST_001');
        expect(op.userId).toEqual(user3Id);
        expect(op.workflowInstanceId).toEqual(wfi3Id);

        const file = await DBService.models.File.findByPk(fileId);
        expect(file).toBeTruthy();
        expect(file.attached).toEqual(true);
        expect(file.workflowInstanceId).toEqual(wfi3Id);

        const op3 = await srv.findOperationByUserId(user3Id, wfi3Id);
        expect(op3).toHaveLength(1);
        expect(op3[0].id).toEqual(op.id);
    });

    it('add operations with files', async() =>{
        const op = await srv.addOperation("ST_002", [fileId, fileId1], {operationData:'hello'}, user4Id, wfi3Id);
        expect(op).toBeTruthy();
        expect(op.id).toBeTruthy();
        expect(op.workflowServiceTask).toEqual('ST_002');

        const op1 = await DBService.models.OP.findByPk(op.id);
        expect(op1).toBeTruthy();
        expect(op1.id).toEqual(op.id);
        expect(op1.workflowServiceTask).toEqual('ST_002');
        expect(op.userId).toEqual(user4Id);
        expect(op.workflowInstanceId).toEqual(wfi3Id);

        const file = await DBService.models.File.findByPk(fileId);
        expect(file).toBeTruthy();
        expect(file.attached).toEqual(true);
        expect(file.workflowInstanceId).toEqual(wfi3Id);

        const file1 = await DBService.models.File.findByPk(fileId1);
        expect(file1).toBeTruthy();
        expect(file1.attached).toEqual(true);
        expect(file1.workflowInstanceId).toEqual(wfi3Id);

        const op3 = await srv.findOperationByUserId(user4Id, wfi3Id);
        expect(op3).toHaveLength(1);
        expect(op3[0].id).toEqual(op.id);
    });

    it('query', async ()=>{
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