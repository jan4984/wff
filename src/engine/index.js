const {Line, Step} = require('./model');
const StartStep = require('./start-event');
const EndStep = require('./end-event');
const ExclusiveStep = require('./exclusive-gateway');
const ParallelStep = require('./parallel-gateway');
const ReceiveStep = require('./service-task');
const ServiceStep = require('./service-task');
const xml = require('fast-xml-parser');
const jsonpath = require('jsonpath');

function _parseAll(nodes, step){
    const refs = [];

}

function _parseNext(nodes, step, refs) {
    const output = [];
    if(step.isEnd){
        return output;
    }

    if(!step.out || !step.out.length)  throw `node ${step.id} have no outputs`;

    step.out.forEach(line=>{
        const lineNode = _findLine(nodes, line.id);
        if(!lineNode) throw `no sequenceFlow ${line.id}`;

        const target = _findLineTarget(nodes, lineNode);
        if(refs.find(r=>r.id == target.task.id)) return;
        if(target.isEnd){
            output.push(
                const o = new EndStep({
                    id:target.task.id,
                    in:
                });
            )
        }
        const lineShape = new Line({id:line.id, in:startStep,out:null, exp:line.bpmn_conditionExpression && line.bpmn_conditionExpression['#text']});
    });
}

function _findLine(nodes, lineId){
    return nodes.bpmn_sequenceFlow.find(n=>n.id == lineId);
}

function _findStep(nodes, id){
    const match = {
        isServiceTask: ()=>nodes.bmpn_serviceTask.find(n=>n.id == id),
        isExclusiveGateway: ()=>nodes.bpmn_xclusiveGateway.find(n=>n.id == id),
        isParallelGateway: ()=>nodes.bpmn_parallelGateway.find(n=>n.id == id),
        isReceiveTask: ()=>nodes.bmpn_receiveTask.find(n=>n.id == id),
        isEnd:()=>nodes.bpmn_endEvent.find(n=>n.id == id)
    };

    const ret = {};
    Object.keys(match).find(k=>{
        const task = match[k]();
        if(task){
            ret[k] = true;
            ret.task = task;
            return true;
        }
        return false;
    });

    return ret;
}

function _findLineTarget(nodes, line) {
    if (!line.targetRef) throw `no target for sequenceFlow ${line.id}`;

    const target = _findStep(nodes, line.targetRef);
    if(!target.task) throw `no target find for id ${line.targetRef}`;
}

function parse(xmlString){
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

    xmlString = xmlString.replace(/<bpmn:/g, '<bpmn_');
    if (!xml.validate(xmlString)) {
        throw 'not a valid xml';
    }
    const nodes = xml.parse(xmlString, parserOptions).bpmn_definitions.bmpn_process;
    const stepTypes = ['bpmn_exclusiveGateway', 'bpmn_serviceTask', 'bpmn_sequenceFlow', 'bpmn_startEvent', 'bpmn_receiveTask', 'bpmn_parallelGateway', 'bpmn_endEvent'];
    stepTypes.forEach(t=>{
        if(nodes[t] && !Array.isArray(nodes[t])){
            nodes[t] = [nodes[t]];
        }
        nodes[t].forEach(n=>{
            if(n.bpmn_incoming && !Array.isArray(n.bpmn_incoming)){
                n.bpmn_incoming = [n.bpmn_incoming];
            }
            if(n.bpmn_outgoing && !Array.isArray(n.bpmn_outgoing)){
                n.bpmn_outgoing = [n.bpmn_outgoing];
            }
        })
    });


    const startStep = new StartStep({id:nodes.bpmn_startEvent[0].id, in:[], out:null});
    const line = _findLine(nodes, nodes.bpmn_startEvent[0].bpmn_outgoing);
    if(!line) throw `can not find sequenceFlow ${nodes.bpmn_startEvent[0].bpmn_outgoing}`;
    const lineShape = new Line({id:line.id, in:startStep,out:null, exp:line.bpmn_conditionExpression && line.bpmn_conditionExpression['#text']});
    _parseAll(nodes, startStep);
}

function go(model, starts){

}
