const {Step} = require('./model');
class ReceiveStep extends Step{
    constructor(props) {
        super(props);
        this.message = props.message;
        this.isReceiveTask = true;
    }
}

module.exports = ReceiveStep;
