const {FileService} = require('../src/file-service');
const FS = require('fs');

const config = {
    endPoint:process.env['MINIO_HOST'] || '192.168.1.125',
    port:process.env['MINIO_PORT'] || 9000,
    bucketName:process.env['MINIO_TEST_BUCKET'] || 'test',
    accessKey: process.env['MINIO_ACCESS_KEY'] || 'ACCESS_KEY',
    secretKey: process.env['MINIO_SECRET_KEY'] || "SECRET_KEY",
};

const testFilePath = 'package.json';

let fs;

describe('__tests__ file service', ()=>{
    beforeAll(async ()=>{
        fs = new FileService(config);
        await fs.init();
    });

    afterAll(async ()=>{
        await fs.clear();
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
            //should not run success
            expect(false).toBe('true');
        }).catch(err=>{
            //not found
            console.log(err);
            expect(err).not.toBeNull();
        });
    });
});
