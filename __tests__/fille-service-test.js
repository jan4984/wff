const {FileService} = require('../src/file-service');
const FS = require('fs');

const config = {
    endPoint:'localhost',
    port:9000,
    bucketName:'test',
    accessKey: 'W92OL40OWMWD0B9PG1XQ',
    secretKey: 'gs6oB2v9pQfqf33xbonpGhar5QCQLWt5drNsP8Yb'
};

const testFilePath = 'package.json';

let fs;

describe('__tests__ file service', ()=>{
    beforeAll(async ()=>{
        fs = new FileService(config);
    });

    afterAll(async ()=>{
        fs.clear();
    });

    it('write get delete', async ()=>{
        const content = FS.readFileSync(testFilePath, {encoding:'utf-8'});
        const id = await fs.upload('myfile', FS.createReadStream(testFilePath));
        const got = await fs.get(id);
        expect(got.id).toBe(id);
        expect(got.name).toBe('myfile');
        expect(got.size).toBe(FS.statSync(testFilePath).size);

        let gotContent = [];
        got.stream.on('data', d=>{
            gotContent.push(d);
        });
        const getDone = new Promise(r=>{
            got.stream.on('end', ()=>{
                const c = Buffer.concat(gotContent).toString('utf-8');
                expect(c).toBe(content);
                r();
            });
        });
        await getDone;
        await fs.del(id);

        await fs.get(id).then(()=>{
            expect(false).toBe('true');
        }).catch(err=>{
            //not found
            console.log(err);
            expect(err).not.toBeNull();
        });
    });
});
