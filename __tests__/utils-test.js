const utils = require('../src/utils');

describe('execute async actions with rollback', ()=>{
    it('sync resolve ok', async ()=>{
        const [act, roll, then] = [jest.fn(), jest.fn(), jest.fn()];
        await utils.ActsWithRollback([[act, roll]]).then(then);
        expect(act).toHaveBeenCalledTimes(1);
        expect(roll).not.toHaveBeenCalled();
        expect(then).toHaveBeenCalledTimes(1);
    });

    it('sync reject ok', async ()=>{
        const [act, roll, then, catchErr] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
        const actWithErr = ()=>{
            act();
            throw 'my err';
        };

        await utils.ActsWithRollback([[actWithErr, roll]]).then(then).catch(catchErr);
        expect(act).toHaveBeenCalledTimes(1);
        expect(roll).not.toHaveBeenCalled();
        expect(then).not.toHaveBeenCalled();
        expect(catchErr).toHaveBeenCalledTimes(1);
        expect(catchErr).toHaveBeenCalledWith('partly full-filled');
    });

    it('async resolve ok', async ()=>{
        const syncAct = jest.fn();
        const act = async () => syncAct();
        const syncRoll = jest.fn();
        const roll = async () => syncRoll();
        const then = jest.fn();
        await utils.ActsWithRollback([[act, roll]]).then(then);
        expect(syncAct).toHaveBeenCalledTimes(1);
        expect(syncRoll).not.toHaveBeenCalled();
        expect(then).toHaveBeenCalledTimes(1);
    });

    it('promise reject 1/2 works', async ()=>{
        const [act, roll, then, catchErr] = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
        const rollPromise = new Promise(r=>{
            setTimeout(()=>{
                roll();
                r();
            }, 200);
        });

        const [act1, roll1] = [jest.fn(), jest.fn()];
        const actWithErr1 = new Promise(r=>{
            act1();
            throw 'my err1';
        });
        const rollPromise1 = new Promise(r=>{
            setTimeout(()=>{
                roll1();
                r();
            }, 200);
        });

        await utils.ActsWithRollback([
            [act, rollPromise],
            [actWithErr1, rollPromise1],
        ]).then(then).catch(catchErr);

        //rollback if action success
        expect(act).toHaveBeenCalledTimes(1);
        expect(roll).toHaveBeenCalledTimes(1);

        //not rollback if action not success
        expect(act1).toHaveBeenCalledTimes(1);
        expect(roll1).not.toHaveBeenCalled();

        expect(then).not.toHaveBeenCalled();
        expect(catchErr).toHaveBeenCalledTimes(1);
        expect(catchErr).toHaveBeenCalledWith('partly full-filled');

        await new Promise(r=>setTimeout(r, 200));
        expect(roll1).toHaveBeenCalledTimes(1);
    });
});