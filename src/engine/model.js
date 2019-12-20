class Step{
    constructor(props){
        this.id = props.id;
        this.in = props.in;
        this.out = props.out;
    }
}

class Express {
    construct(props){
        if(props) {
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
        this.exp = props.exp;
    }
}

class Model {
    constructor(_root) {
        this.root = _root;
    }
}

module.exports={Step, Line};
