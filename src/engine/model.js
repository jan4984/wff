class Step{
    constructor(props){
        this.id = props.id;
        this.in = props.in;
        this.out = props.out;
        this.name = props.node.name;
    }
}

class Express {
    constructor(props){
        if(props && props.text) {
            const parts = props.text.split('==').map(v => v.trim());
            this.paths = parts[0].split('.');
            this.value = parts[1].replace(/"/g, '');
        }
    }

    resolve(variables){
        if(this.paths && this.paths.length > 0){
            const value = this.paths.reduce((v, i)=>{
                if(v) return v[i];
                return undefined;
            }, variables);

            return value && value == this.value;
        }else{
            return true;
        }
    }
}

class Line{
    constructor(props){
        this.id = props.id;
        this.in = props.in;
        this.out = props.out;
        this.exp = new Express({text:props.exp});
    }
    resolve(variables){
        if(!this.exp) return true;
        return this.exp.resolve(variables);
    }
}

class Model {
    constructor(_root) {
        this.root = _root;
    }

    _findStep(name){
        const resultContainer = [];
        this._findStepRecursively(this.root, name, new Set(), resultContainer);
        if(resultContainer.length == 0) throw `can not find step named ${name}`;
        return resultContainer[0];
    }

    _findStepRecursively(step, name, unloop, result){
        if(step.name == name){
            result.push(step);
            return step;
        }

        return step.out.find(line=>{
            if(unloop.has(line.out)) return false;
            unloop.add(line.out);
            return this._findStepRecursively(line.out, name, unloop, result);
        });
    }

    _all(filter, step, outputs){
        step.out.forEach(l=>{
            if(outputs.has(l.out))  return;
            if(filter(l.out)) outputs.add(l.out);
            this._all(filter, l.out, outputs);
            return;
        });
        return outputs;
    }

    getTaskByName(name){
        return this._findStep(name);
    }

    getTasks(){
        return [...(this._all(s=>s.isServiceTask || s.isReceiveTask, this.root, new Set()))];
    }

    nextProcess(dones, variables, message){
        if(!Array.isArray(dones)) dones = [dones];
        dones = dones.map(n=>(n.isStart && this.root) || n);
        const lines = new Set();
        const outputs = new Set();
        const expects = [];
        this.getNext(dones, variables, message, lines, outputs, expects);
        if(outputs.size == 0)  throw expects;
        return [...outputs];
    }

    getNext(done, variables, message, lines, outputs, expects) {
        const doneSteps = done.map(n=>this._findStep(n.name));
        const nextSteps = doneSteps.map(s=>{
            return s.out.map(l=>{
                const target = (function() {
                    expects.push(`${s.name} => ${l.out.name} with exp(${l.exp}) with message ${l.message}`);
                    if (l.resolve(variables)) {
                        if (!message) return l.out;
                        if (!l.out.isReceiveTask) return l.out;
                        if (l.out.message == message) return l.out;
                    }
                    return null;
                })();

                if(target) {
                    lines.add(l);
                }

                return target;
            })
        });
        const nextSet = nextSteps.reduce((v,i)=>{
            i.forEach(ii=>ii && v.add(ii));
            return v;
        }, new Set());

        nextSet.forEach(s=>{
            if(s.isEnd){
                outputs.add(s);
            }else if(s.isServiceTask){
                outputs.add(s);
            }else if(s.isReceiveTask){
                outputs.add(s);
            }else if(s.isExclusiveGateway){
                this.getNext([s], variables, message, lines, outputs, expects);
            }else if(s.isParallelGateway) {
                expects.push(`${s.name} => all line in matches`);
                if(s.in.every(l=>lines.has(l))){
                    //all in line matches
                    this.getNext([s], variables, message, lines, outputs, expects);
                }else{
                    outputs.add(s);
                }
            }
        });
    }
}

module.exports={Step, Line, Model};
