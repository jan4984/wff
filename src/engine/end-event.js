const {Step} = require('./model');
class EndStep extends Step{
    constructor(props) {
        super(props);
        this.isEnd = true;
    }

}


module.exports = EndStep;
