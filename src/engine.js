const xml = require('fast-xml-parser');
const jsonpath = require('jsonpath');

const parserOptions = {
    allowBooleanAttributes: false,
    attrNodeName: false,//'attr',
    attributeNamePrefix: '',
    cdataPositionChar: '\\c',
    cdataTagName: '__cdata',
    ignoreAttributes: false,
    ignoreNameSpace: true,
    localeRange: '',
    parseAttributeValue: true,
    parseNodeValue: true,
    parseTrueNumberOnly: false,
    textNodeName: '#text',
    trimValues: true,
};

class BpmnEngine {
    constructor(xmlString){
        xmlString = xmlString.replace(/<bpmn:/g, '<bpmn_');
        if (!xml.validate(xmlString)) {
            throw 'not a valid xml';
        }
        this.json = xml.parse(xmlString, parserOptions);
    }

    getTasks(){
        return jsonpath.query(this.json, '$..bpmn_serviceTask')[0];
    }

    findByIncoming(id){
        const match = {
            isServiceTask:[`$..bpmn_serviceTask[?(@.bpmn_incoming=="${id}")]`, `$..bpmn_serviceTask[?(@.bpmn_incoming.indexOf("${id}") != -1 )]`],
            isGateway:[`$..bpmn_exclusiveGateway[?(@.bpmn_incoming.indexOf("${id}") != -1 )]`, `$..bpmn_exclusiveGateway[?(@.bpmn_incoming=="${id}")]`],
            //isEnd:[`$..bpmn_endEvent[?(@.bpmn_incoming=="${id}")]`, `$..bpmn_endEvent[?(@.bpmn_incoming.indexOf("${id}") != -1 )]`]
        };

        const task = Object.keys(match).reduce((v,i)=>{
            match[i].find(jp=>{
                const tasks = jsonpath.query(this.json, jp);
                if(tasks.length > 0){
                    v.task = tasks[0];
                    v[i]=true;
                    return true;
                }
                return false;
            });
            return v;
        },{isGateway:false, isServiceTask:false, isEnd:false, task:null});

        if(!task.task){
            if(jsonpath.query(this.json, '$..bpmn_endEvent')[0].bpmn_incoming == id){
                return {isEnd:true}
            }
        }

        return task;
    }

    nextProcess(currentTask, variables){
        let task;
        if(currentTask.isStart) {
            task = jsonpath.query(this.json, `$..bpmn_startEvent`)[0];
        }else if(currentTask.isGateway){
            const tasks = jsonpath.query(this.json, `$..bpmn_exclusiveGateway[?(@.name=="${currentTask.task.name}")]`);
            task = tasks && tasks[0];
        }else {
            const tasks = jsonpath.query(this.json, `$..bpmn_serviceTask[?(@.name=="${currentTask.task.name}")]`);
            task = tasks && tasks[0];
        }

        if (!task) throw `no process named${currentTask.task.name}`;
        let flow = task['bpmn_outgoing'];
        if(Array.isArray(flow)){
            if(!currentTask.isGateway)
                throw 'only gateway can have multiple outgoing';

            if(!variables || typeof(variables) != 'object'){
                throw 'need variable object for gateway'
            }

            const matchers = flow.map(f=>{
                const seq = jsonpath.query(this.json, `$..bpmn_sequenceFlow[?(@.id=="${f}")]`);
                if(seq.length == 0) throw `not find sequenceFlow ${f} for gateway ${task.name}`;
                const exp = seq[0].bpmn_conditionExpression['#text'];
                if(!exp) throw `sequenceFlow ${f} not have expression`;
                return {id: f, exp:exp.split('==').map(v=>v.trim().replace(/"/g,""))};
            });
            const match = matchers.find(v=>{
                const value = v.exp[0].split('.').reduce((v, path)=>{
                    if(!v) return v;
                    return v[path];
                }, variables);

                if(!value) return false;
                return value == v.exp[1];
            });

            if(!match)
                throw `varaible ${JSON.stringify(variables)} can match none of ${JSON.stringify(matchers)}`;
            flow = match.id;
        }

        const next = this.findByIncoming(flow);
        if(next.isGateway) return this.nextProcess(next, variables);
        return next;
    }
}

module.exports={
    BpmnEngine
}