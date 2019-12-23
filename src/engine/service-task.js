const {Step} = require('./model');
class ServiceStep extends Step{
    constructor(props){
        super(props)
        this.isServiceTask = true;
    }
}

module.exports = ServiceStep;
