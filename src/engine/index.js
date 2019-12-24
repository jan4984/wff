const {Line, Step, Model} = require('./model');
const StartStep = require('./start-event');
const EndStep = require('./end-event');
const ExclusiveStep = require('./exclusive-gateway');
const ParallelStep = require('./parallel-gateway');
const ReceiveStep = require('./receive-task');
const ServiceStep = require('./service-task');
const xml = require('fast-xml-parser');

function _parseAll(nodes, step){
    const refs = [];
    let outputs = [step]
    while(outputs.length > 0){
        const itr = outputs.slice(0);
        outputs.length = 0;
        itr.forEach(s=>{
            _parseNext(nodes, s, refs).forEach(n=>outputs.push(n));
        });
    }
}

//add targetStep, but not resolve targetStep's outgoing target
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
        let targetStep;
        targetStep = refs.find(r=>r.id == target.task.id);
        if(!targetStep) {
            if(!target.task.name) throw `all step must has name, but ${target.task.id} not`;
            for(const ref = refs.find(r=>r.name == target.task.name); ref ;){
                throw `name ${target.name} have been used by node ${ref.id}`;
            }
            const props = {id:target.task.id, in:[], out:[], node:target.task};
            if (target.isEnd) targetStep = new EndStep(props);
            else if (target.isServiceTask) targetStep = new ServiceStep(props);
            else if (target.isReceiveTask) {
                const msg = nodes.bpmn_message.find(n=>n.id==target.task.messageRef);
                if(!msg) throw `can not find message ${target.task.messageRef} definition`;
                if(!msg.name) throw `message ${target.task.messageRef} not have name`;
                props.message = msg.name;
                targetStep = new ReceiveStep(props);
            }
            else if (target.isExclusiveGateway) targetStep = new ExclusiveStep(props);
            else if (target.isParallelGateway) targetStep = new ParallelStep(props);
            else throw 'unknown step type';
            output.push(targetStep);
            refs.push(targetStep);
            targetStep.in = [];
            targetStep.out = [];
            if(target.task.bpmn_outgoing) {
                targetStep.out = target.task.bpmn_outgoing.map(f => {
                    const targetStepOutLine = _findLine(nodes, f);
                    if (!targetStepOutLine) throw `no sequenceFlow ${f}`;
                    return new Line({
                        id: f,
                        in: targetStep,
                        exp: targetStepOutLine.bpmn_conditionExpression && targetStepOutLine.bpmn_conditionExpression['#text']
                    });
                });
            }
        }

        line.out = targetStep;
        targetStep.in.push(line);
    });

    return output;
}

function _findLine(nodes, lineId){
    return nodes.bpmn_sequenceFlow.find(n=>n.id == lineId);
}

function _findStep(nodes, id){
    const match = {
        isServiceTask: ()=>nodes.bpmn_serviceTask.find(n=>n.id == id),
        isExclusiveGateway: ()=>nodes.bpmn_exclusiveGateway.find(n=>n.id == id),
        isParallelGateway: ()=>nodes.bpmn_parallelGateway.find(n=>n.id == id),
        isReceiveTask: ()=>nodes.bpmn_receiveTask.find(n=>n.id == id),
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

    return target;
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
    const json = xml.parse(xmlString, parserOptions);
    const nodes = json.bpmn_definitions.bpmn_process;
    nodes.bpmn_message = json.bpmn_definitions.bpmn_message;
    const stepTypes = ['bpmn_exclusiveGateway', 'bpmn_serviceTask', 'bpmn_sequenceFlow', 'bpmn_startEvent', 'bpmn_receiveTask', 'bpmn_parallelGateway', 'bpmn_endEvent'];
    stepTypes.forEach(t=>{
        if(nodes[t] && !Array.isArray(nodes[t])){
            nodes[t] = [nodes[t]];
        }
        if(!nodes[t]) nodes[t] = [];
        nodes[t].forEach(n=>{
            if(n.bpmn_incoming && !Array.isArray(n.bpmn_incoming)){
                n.bpmn_incoming = [n.bpmn_incoming];
            }
            if(n.bpmn_outgoing && !Array.isArray(n.bpmn_outgoing)){
                n.bpmn_outgoing = [n.bpmn_outgoing];
            }
        })
    });


    const startStep = new StartStep({id:nodes.bpmn_startEvent[0].id, in:[], out:null, node:nodes.bpmn_startEvent[0]});
    const line = _findLine(nodes, nodes.bpmn_startEvent[0].bpmn_outgoing);
    if(!line) throw `can not find sequenceFlow ${nodes.bpmn_startEvent[0].bpmn_outgoing}`;
    const lineShape = new Line({id:line.id, in:startStep,out:null, exp:line.bpmn_conditionExpression && line.bpmn_conditionExpression['#text']});
    startStep.out = [lineShape];
    _parseAll(nodes, startStep);
    return new Model(startStep);
}

module.exports = {
    parse
};
