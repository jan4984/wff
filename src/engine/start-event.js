const {Step} = require('./model');
class StartStep extends Step{
    constructor(props) {
        super(props);
        this.isStart = true;
    }

}

module.exports = StartStep;
