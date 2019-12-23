const WorkflowFramework = require('../src/workflow-framework');
const DBService = require('../src/db-service');
const uuid = require('uuid/v4');

const dbConfig = {
    host:process.env['DB_HOST'] || 'localhost',
    port:process.env['DB_PORT'] || 5432,
    database:process.env['DB_DATABASE'] || 'test',
    username: process.env['DB_USER'] || 'postgres',
    password: process.env['DB_PASSWORD'] || "postgres",
    recreate: true
};

const wff = new WorkflowFramework();
let wfi = null;

const sleep = async (ms)=> {
    return new Promise((resolve => setTimeout(resolve, ms)));
};

describe('__tests__ workflow framework', ()=> {
    beforeAll(async () => {
        await DBService.get(dbConfig);
        await wff.initialize();
    });

    // it('test restore', async ()=> {
    //     wfi = 'a0cd0108-1f5a-45f9-863d-006b36238140';
    //     const result = await wff.deployWorkflow('d:/cae2.bpmn');
    //     expect(result).toEqual(1);
    //
    //     let sta = wff.getWorkflowInstanceState(wfi);
    //     expect(sta.status).toEqual('processing');
    //     expect(sta.currentTasks).toContain('商务确认')
    //
    //     await wff.addOperation(wfi, '硬件项目资料', {key1: 'value1'}).catch(e => {
    //         if (!e.toString().includes('流程不处于')) {
    //             throw e;
    //         }
    //     });
    //
    //     await wff.addOperation(wfi, '商务确认', {status: '通过'});
    //     await sleep(50);
    //     await wff.addOperation(wfi, '提供调试算法库', {status: '通过'});
    //     await sleep(50);
    //     await wff.addOperation(wfi, '提供整机音频', {key8: 'value8'});
    //     await sleep(50);
    //     await wff.addOperation(wfi, '整机测试', {status: '不通过'});
    //     await sleep(50);
    //     await wff.addOperation(wfi, '客户归档', {key9: 'value9'});
    //     await sleep(50);
    //     await wff.addOperation(wfi, '中台归档', {key10: 'value10'});
    //     await sleep(50);
    //
    //     sta = wff.getWorkflowInstanceState(wfi);
    //     expect(sta.status).toEqual('end');
    // });

    it('deploy workflow test', async ()=> {
        const result = await wff.deployWorkflow('d:/cae2.bpmn');
        expect(result).toBeTruthy();
        console.log('new workflow', result);

        const result2 = await wff.deployWorkflow('d:/cae2.bpmn');
        expect(result).toEqual(result2);
    });

    it('create workflow instance test', async ()=> {
        var vars = {商务确认: {data: {status: "等待"}}};
        const result = await wff.createWorkflowInstance(vars);
        expect(result).toBeTruthy();
        const verify = await DBService.models.WFI.findOne({where: {id: result}});
        expect(verify.variables).toEqual(vars);
        wfi = result;
    }, 10000);

    it('flow test', async ()=> {
        await wff.addOperation(wfi, '商务确认', {status: '通过'}).catch(e => {
            if (!e.toString().includes('流程不处于')) {
                throw e;
            }
        });

        const var1 = {key1: 'value1'};
        await wff.addOperation(wfi, '硬件项目资料', var1);
        const result = await wff.getOperation(wfi, '硬件项目资料');
        expect(var1).toEqual(result.data);
        await sleep(50);

        const var2 = {key2: 'value2'};
        await wff.addOperation(wfi, '审核资料', var2).catch(e => {
            if (!e.toString().includes('提交的参数格式不正确')) {
                throw e;
            }
        });

        await wff.addOperation(wfi, '审核资料', {status: '不通过'});
        await sleep(50);

        await wff.addOperation(wfi, '指定FAE', {key3: 'value3'}).catch(e => {
            if (!e.toString().includes('流程不处于')) {
                throw e;
            }
        });

        await wff.addOperation(wfi, '硬件项目资料', var1);
        await sleep(50);
        await wff.addOperation(wfi, '审核资料', {status: '通过'});
        await sleep(50);
        await wff.addOperation(wfi, '指定FAE', {key4: 'value4'});
        await sleep(50);
        await wff.addOperation(wfi, '提交硬件结构资料是否有整机', {key5: 'value5'});
        await sleep(50);
        await wff.addOperation(wfi, '提供案例音频，音频测试', {key6: 'value6'});
        await sleep(50);
        await wff.addOperation(wfi, '提交编译链', {key7: 'value7'});
        await sleep(50);
        await wff.addOperation(wfi, '商务确认', {status: '通过'});
        await sleep(50);
        await wff.addOperation(wfi, '提供调试算法库', {status: '通过'});
        await sleep(50);
        await wff.addOperation(wfi, '提供整机音频', {key8: 'value8'});
        await sleep(50);
        await wff.addOperation(wfi, '整机测试', {status: '不通过'});
        await sleep(50);
        await wff.addOperation(wfi, '客户归档', {key9: 'value9'});
        await sleep(50);
        await wff.addOperation(wfi, '中台归档', {key10: 'value10'});
        await sleep(50);

        const sta = wff.getWorkflowInstanceState(wfi);
        expect(sta.status).toEqual('end');

    }, 10000)
});
