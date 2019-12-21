const {Step} = require('./model');
class ReceiveStep extends Step{
    constructor(props) {
        super(props);
        this.message = props.node.messageRef;
        this.isReceiveTask = true;
    }
}

module.exports = ReceiveStep;
