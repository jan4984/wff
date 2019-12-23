const {Step} = require('./model');
class ParallelStep extends Step{
    constructor(props) {
        super(props);
        this.isParallelGateway =  true;
    }
}

module.exports = ParallelStep;
