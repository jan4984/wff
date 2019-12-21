const {Step} = require('./model');
class ExclusiveStep extends Step{
    constructor(props) {
        super(props);
        this.isExclusiveGateway = true;
    }

}


module.exports = ExclusiveStep;
