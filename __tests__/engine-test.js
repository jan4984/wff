const {parse} = require('../src/engine');

describe('test engine', async () => {
    let e;
    beforeAll(async () => {
        e = parse('<?xml version="1.0" encoding="UTF-8"?>\n' +
            '<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:zeebe="http://camunda.org/schema/zeebe/1.0" id="Definitions_1wdgt9y" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Zeebe Modeler" exporterVersion="0.7.0">\n' +
            '  <bpmn:process id="Process_0fkfho2" name="是" isExecutable="true">\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_1pr5was" name="审核是否通过">\n' +
            '      <bpmn:incoming>SequenceFlow_0ha09no</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1g1a85j</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_1qr0u5s</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:serviceTask id="ST_reviewRecordedAudio" name="音频测试">\n' +
            '      <bpmn:extensionElements>\n' +
            '        <zeebe:taskDefinition type="音频测试" />\n' +
            '      </bpmn:extensionElements>\n' +
            '      <bpmn:incoming>SequenceFlow_1qmb0rb</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0bgk8b7</bpmn:outgoing>\n' +
            '    </bpmn:serviceTask>\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_13nkh6f" name="测试是否通过">\n' +
            '      <bpmn:incoming>SequenceFlow_0bgk8b7</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0pdmw94</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_0cwwdaf</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_0w3lg3f" name="是否需要整机测试">\n' +
            '      <bpmn:incoming>SequenceFlow_0s4ozcy</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1su0gr7</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_0hccz50</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1g1a85j" name="是" sourceRef="ExclusiveGateway_1pr5was" targetRef="RT_arrangeFAE">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">审核资料.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0pdmw94" name="否" sourceRef="ExclusiveGateway_13nkh6f" targetRef="RT_submitRecordedAudio">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">音频测试.data.status=="不通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0ha09no" sourceRef="RT_reviewProductInfo" targetRef="ExclusiveGateway_1pr5was" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1tw0rt7" sourceRef="RT_arrangeFAE" targetRef="RT_submitHWInfo" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0hhat0z" sourceRef="RT_submitHWInfo" targetRef="RT_submitRecordedAudio" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1qmb0rb" sourceRef="RT_submitRecordedAudio" targetRef="ST_reviewRecordedAudio" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_19p6bkt" sourceRef="RT_reviewHWInfo" targetRef="RT_provideCAE" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1wem2sf" sourceRef="RT_provideCAE" targetRef="ExclusiveGateway_03krq69" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0plyn7b" sourceRef="RT_sendDevice" targetRef="ExclusiveGateway_0j3mf7u" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1su0gr7" name="是" sourceRef="ExclusiveGateway_0w3lg3f" targetRef="RT_reviewDevice">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">整机测试.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1hzafyx" sourceRef="RT_reviewDevice" targetRef="ReceiveTask_0tjheug" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0mzj0jd" sourceRef="ReceiveTask_0tjheug" targetRef="ServiceTask_16fss4z" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0s4ozcy" sourceRef="ReceiveTask_1mo6f0t" targetRef="ExclusiveGateway_0w3lg3f" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1sw4xgg" sourceRef="ReceiveTask_079wsx8" targetRef="ExclusiveGateway_0sird3c" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1dbxq96" sourceRef="ReceiveTask_1loxs2g" targetRef="RT_reviewProductInfo" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1qr0u5s" name="否" sourceRef="ExclusiveGateway_1pr5was" targetRef="ReceiveTask_1loxs2g">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">审核资料.data.status=="不通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:startEvent id="StartEvent_06toytj" name="开始">\n' +
            '      <bpmn:outgoing>SequenceFlow_0ii8l4d</bpmn:outgoing>\n' +
            '    </bpmn:startEvent>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0ii8l4d" sourceRef="StartEvent_06toytj" targetRef="ReceiveTask_1loxs2g" />\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_0j3mf7u" name="征集音频测试是否通过">\n' +
            '      <bpmn:incoming>SequenceFlow_0plyn7b</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1y4vstm</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_0zdljvg</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_00pm2he" sourceRef="ReceiveTask_023yrw4" targetRef="RT_sendDevice" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1y4vstm" name="否" sourceRef="ExclusiveGateway_0j3mf7u" targetRef="ReceiveTask_023yrw4">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">整机音频测试.data.status=="不通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0zdljvg" name="是" sourceRef="ExclusiveGateway_0j3mf7u" targetRef="ReceiveTask_1mo6f0t">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">整机音频测试.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0cwwdaf" name="是" sourceRef="ExclusiveGateway_13nkh6f" targetRef="ReceiveTask_079wsx8">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">音频测试.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_03krq69" name="提供调试算法库是否成功">\n' +
            '      <bpmn:incoming>SequenceFlow_1wem2sf</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0g1f82o</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_1csip2t</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0g1f82o" name="是" sourceRef="ExclusiveGateway_03krq69" targetRef="ReceiveTask_023yrw4">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">提供调试算法库.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1csip2t" name="否" sourceRef="ExclusiveGateway_03krq69" targetRef="ReceiveTask_079wsx8">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">提供调试算法库.data.status=="不通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:exclusiveGateway id="ExclusiveGateway_0sird3c" name="商务是否确认过">\n' +
            '      <bpmn:incoming>SequenceFlow_1sw4xgg</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_19fiwc1</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_0nuz1bq</bpmn:outgoing>\n' +
            '    </bpmn:exclusiveGateway>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_19fiwc1" name="是" sourceRef="ExclusiveGateway_0sird3c" targetRef="RT_provideCAE">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">商务确认.data.status=="通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0nuz1bq" name="否" sourceRef="ExclusiveGateway_0sird3c" targetRef="RT_reviewHWInfo">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">商务确认.data.status=="等待"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0bgk8b7" sourceRef="ST_reviewRecordedAudio" targetRef="ExclusiveGateway_13nkh6f" />\n' +
            '    <bpmn:serviceTask id="RT_sendDevice" name="整机音频测试">\n' +
            '      <bpmn:extensionElements>\n' +
            '        <zeebe:taskDefinition type="整机音频测试" />\n' +
            '      </bpmn:extensionElements>\n' +
            '      <bpmn:incoming>SequenceFlow_00pm2he</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0plyn7b</bpmn:outgoing>\n' +
            '    </bpmn:serviceTask>\n' +
            '    <bpmn:receiveTask id="ReceiveTask_1loxs2g" name="硬件项目资料" messageRef="Message_0gblaiz">\n' +
            '      <bpmn:incoming>SequenceFlow_1qr0u5s</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_0ii8l4d</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1dbxq96</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_reviewProductInfo" name="审核资料" messageRef="Message_0gu71bi">\n' +
            '      <bpmn:incoming>SequenceFlow_1dbxq96</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0ha09no</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_arrangeFAE" name="指定FAE" messageRef="Message_0z3obk2">\n' +
            '      <bpmn:incoming>SequenceFlow_1g1a85j</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1tw0rt7</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_submitHWInfo" name="提交硬件结构资料是否有整机" messageRef="Message_10039n3">\n' +
            '      <bpmn:incoming>SequenceFlow_1tw0rt7</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0hhat0z</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_submitRecordedAudio" name="提供案例音频，音频测试" messageRef="Message_04kfia9">\n' +
            '      <bpmn:extensionElements>\n' +
            '        <zeebe:taskDefinition type="recordedAudioService" />\n' +
            '      </bpmn:extensionElements>\n' +
            '      <bpmn:incoming>SequenceFlow_0pdmw94</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_0hhat0z</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1qmb0rb</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="ReceiveTask_079wsx8" name="提交编译链" messageRef="Message_1rjqgaj">\n' +
            '      <bpmn:incoming>SequenceFlow_0cwwdaf</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_1csip2t</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1sw4xgg</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_reviewHWInfo" name="商务确认" messageRef="Message_1cbmfw1">\n' +
            '      <bpmn:incoming>SequenceFlow_0nuz1bq</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_19p6bkt</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_provideCAE" name="提供调试算法库" messageRef="Message_04ua7yr">\n' +
            '      <bpmn:incoming>SequenceFlow_19p6bkt</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_19fiwc1</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1wem2sf</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="ReceiveTask_023yrw4" name="提供整机音频" messageRef="Message_1pbgfsf">\n' +
            '      <bpmn:incoming>SequenceFlow_1y4vstm</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_0g1f82o</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_00pm2he</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="ReceiveTask_1mo6f0t" name="整机测试" messageRef="Message_0sw9hei">\n' +
            '      <bpmn:incoming>SequenceFlow_0zdljvg</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0s4ozcy</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_reviewDevice" name="已收到整机" messageRef="Message_07qg2r1">\n' +
            '      <bpmn:incoming>SequenceFlow_1su0gr7</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1hzafyx</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="ReceiveTask_0tjheug" name="开始测试" messageRef="Message_1h4v8si">\n' +
            '      <bpmn:incoming>SequenceFlow_1hzafyx</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0mzj0jd</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="ServiceTask_16fss4z" name="测试完成" messageRef="Message_0fbkwyd">\n' +
            '      <bpmn:incoming>SequenceFlow_0mzj0jd</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0vkobon</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:receiveTask id="RT_storeDevice" name="客户归档" messageRef="Message_0lc5cht">\n' +
            '      <bpmn:incoming>SequenceFlow_053cnrr</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_0qxsidm</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0vkobon" sourceRef="ServiceTask_16fss4z" targetRef="ServiceTask_1nyqqf7" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0hccz50" name="否" sourceRef="ExclusiveGateway_0w3lg3f" targetRef="ServiceTask_1nyqqf7">\n' +
            '      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">整机测试.data.status=="不通过"</bpmn:conditionExpression>\n' +
            '    </bpmn:sequenceFlow>\n' +
            '    <bpmn:parallelGateway id="ExclusiveGateway_05di7z3" name="开始双方归档">\n' +
            '      <bpmn:incoming>SequenceFlow_1d50lil</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_053cnrr</bpmn:outgoing>\n' +
            '      <bpmn:outgoing>SequenceFlow_0qtgazi</bpmn:outgoing>\n' +
            '    </bpmn:parallelGateway>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_053cnrr" sourceRef="ExclusiveGateway_05di7z3" targetRef="RT_storeDevice" />\n' +
            '    <bpmn:receiveTask id="ReceiveTask_0st5gqg" name="中台归档" messageRef="Message_0893owa">\n' +
            '      <bpmn:incoming>SequenceFlow_0qtgazi</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1safbmu</bpmn:outgoing>\n' +
            '    </bpmn:receiveTask>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0qtgazi" sourceRef="ExclusiveGateway_05di7z3" targetRef="ReceiveTask_0st5gqg" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_0qxsidm" sourceRef="RT_storeDevice" targetRef="ExclusiveGateway_14oe82k" />\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1safbmu" sourceRef="ReceiveTask_0st5gqg" targetRef="ExclusiveGateway_14oe82k" />\n' +
            '    <bpmn:parallelGateway id="ExclusiveGateway_14oe82k" name="双方归档完成">\n' +
            '      <bpmn:incoming>SequenceFlow_0qxsidm</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_1safbmu</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1st7fgw</bpmn:outgoing>\n' +
            '    </bpmn:parallelGateway>\n' +
            '    <bpmn:serviceTask id="ServiceTask_04nl2xl" name="归档">\n' +
            '      <bpmn:incoming>SequenceFlow_1st7fgw</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1buu5sa</bpmn:outgoing>\n' +
            '    </bpmn:serviceTask>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1st7fgw" sourceRef="ExclusiveGateway_14oe82k" targetRef="ServiceTask_04nl2xl" />\n' +
            '    <bpmn:endEvent id="EndEvent_0chl8lr" name="结束">\n' +
            '      <bpmn:incoming>SequenceFlow_1buu5sa</bpmn:incoming>\n' +
            '    </bpmn:endEvent>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1buu5sa" sourceRef="ServiceTask_04nl2xl" targetRef="EndEvent_0chl8lr" />\n' +
            '    <bpmn:serviceTask id="ServiceTask_1nyqqf7" name="等待归档">\n' +
            '      <bpmn:incoming>SequenceFlow_0hccz50</bpmn:incoming>\n' +
            '      <bpmn:incoming>SequenceFlow_0vkobon</bpmn:incoming>\n' +
            '      <bpmn:outgoing>SequenceFlow_1d50lil</bpmn:outgoing>\n' +
            '    </bpmn:serviceTask>\n' +
            '    <bpmn:sequenceFlow id="SequenceFlow_1d50lil" sourceRef="ServiceTask_1nyqqf7" targetRef="ExclusiveGateway_05di7z3" />\n' +
            '  </bpmn:process>\n' +
            '  <bpmn:message id="Message_0fau62u" name="创建硬件产品">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_10039n3" name="提交硬件结构资料是否有整机">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0gu71bi" name="审核资料">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0z3obk2" name="指定FAE">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_04kfia9" name="提供案例音频，音频测试">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_04ua7yr" name="提供调试算法库">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0o38fx4" name="整机音频测试">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0sw9hei" name="整机测试">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1lf9e3w" name="归档">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_07qg2r1" name="已收到整机">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1rjqgaj" name="提交编译链">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1h4v8si" name="开始测试">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0fbkwyd" name="测试完成">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1cbmfw1" name="商务确认">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0gblaiz" name="硬件项目资料">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1i6rkwm" name="提供整机音频">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_1pbgfsf" name="提供整机音频">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0lc5cht" name="客户归档">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmn:message id="Message_0893owa" name="中台归档">\n' +
            '    <bpmn:extensionElements>\n' +
            '      <zeebe:subscription correlationKey="instanceKey" />\n' +
            '    </bpmn:extensionElements>\n' +
            '  </bpmn:message>\n' +
            '  <bpmndi:BPMNDiagram id="BPMNDiagram_1">\n' +
            '    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_0fkfho2">\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_1pr5was_di" bpmnElement="ExclusiveGateway_1pr5was" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="675" y="175" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="667" y="235" width="66" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1g1a85j_di" bpmnElement="SequenceFlow_1g1a85j">\n' +
            '        <di:waypoint x="725" y="200" />\n' +
            '        <di:waypoint x="795" y="200" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="734" y="182" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ServiceTask_0nx23hl_di" bpmnElement="ST_reviewRecordedAudio">\n' +
            '        <dc:Bounds x="680" y="420" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_13nkh6f_di" bpmnElement="ExclusiveGateway_13nkh6f" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="875" y="435" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="867" y="495" width="66" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1tw0rt7_di" bpmnElement="SequenceFlow_1tw0rt7">\n' +
            '        <di:waypoint x="845" y="240" />\n' +
            '        <di:waypoint x="845" y="280" />\n' +
            '        <di:waypoint x="330" y="280" />\n' +
            '        <di:waypoint x="330" y="420" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1qmb0rb_di" bpmnElement="SequenceFlow_1qmb0rb">\n' +
            '        <di:waypoint x="570" y="460" />\n' +
            '        <di:waypoint x="680" y="460" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0hhat0z_di" bpmnElement="SequenceFlow_0hhat0z">\n' +
            '        <di:waypoint x="395" y="460" />\n' +
            '        <di:waypoint x="470" y="460" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1wem2sf_di" bpmnElement="SequenceFlow_1wem2sf">\n' +
            '        <di:waypoint x="1370" y="300" />\n' +
            '        <di:waypoint x="1370" y="435" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0plyn7b_di" bpmnElement="SequenceFlow_0plyn7b">\n' +
            '        <di:waypoint x="1320" y="720" />\n' +
            '        <di:waypoint x="1230" y="720" />\n' +
            '        <di:waypoint x="1230" y="615" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1hzafyx_di" bpmnElement="SequenceFlow_1hzafyx">\n' +
            '        <di:waypoint x="660" y="580" />\n' +
            '        <di:waypoint x="560" y="580" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0mzj0jd_di" bpmnElement="SequenceFlow_0mzj0jd">\n' +
            '        <di:waypoint x="460" y="580" />\n' +
            '        <di:waypoint x="340" y="580" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0pdmw94_di" bpmnElement="SequenceFlow_0pdmw94">\n' +
            '        <di:waypoint x="900" y="435" />\n' +
            '        <di:waypoint x="900" y="370" />\n' +
            '        <di:waypoint x="520" y="370" />\n' +
            '        <di:waypoint x="520" y="420" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="910" y="398" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_0w3lg3f_di" bpmnElement="ExclusiveGateway_0w3lg3f" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="845" y="555" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="827" y="533" width="88" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0s4ozcy_di" bpmnElement="SequenceFlow_0s4ozcy">\n' +
            '        <di:waypoint x="1030" y="580" />\n' +
            '        <di:waypoint x="895" y="580" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1su0gr7_di" bpmnElement="SequenceFlow_1su0gr7">\n' +
            '        <di:waypoint x="845" y="580" />\n' +
            '        <di:waypoint x="760" y="580" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="799" y="562" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0ha09no_di" bpmnElement="SequenceFlow_0ha09no">\n' +
            '        <di:waypoint x="500" y="200" />\n' +
            '        <di:waypoint x="675" y="200" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_19p6bkt_di" bpmnElement="SequenceFlow_19p6bkt">\n' +
            '        <di:waypoint x="1280" y="260" />\n' +
            '        <di:waypoint x="1320" y="260" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1sw4xgg_di" bpmnElement="SequenceFlow_1sw4xgg">\n' +
            '        <di:waypoint x="1080" y="420" />\n' +
            '        <di:waypoint x="1080" y="385" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1dbxq96_di" bpmnElement="SequenceFlow_1dbxq96">\n' +
            '        <di:waypoint x="330" y="200" />\n' +
            '        <di:waypoint x="400" y="200" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1qr0u5s_di" bpmnElement="SequenceFlow_1qr0u5s">\n' +
            '        <di:waypoint x="700" y="175" />\n' +
            '        <di:waypoint x="700" y="100" />\n' +
            '        <di:waypoint x="160" y="100" />\n' +
            '        <di:waypoint x="160" y="200" />\n' +
            '        <di:waypoint x="230" y="200" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="426" y="82" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="StartEvent_06toytj_di" bpmnElement="StartEvent_06toytj">\n' +
            '        <dc:Bounds x="262" y="312" width="36" height="36" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="269" y="355" width="22" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0ii8l4d_di" bpmnElement="SequenceFlow_0ii8l4d">\n' +
            '        <di:waypoint x="280" y="312" />\n' +
            '        <di:waypoint x="280" y="240" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_0j3mf7u_di" bpmnElement="ExclusiveGateway_0j3mf7u" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="1205" y="565" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1195" y="535" width="77" height="27" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_00pm2he_di" bpmnElement="SequenceFlow_00pm2he">\n' +
            '        <di:waypoint x="1370" y="630" />\n' +
            '        <di:waypoint x="1370" y="680" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1y4vstm_di" bpmnElement="SequenceFlow_1y4vstm">\n' +
            '        <di:waypoint x="1255" y="590" />\n' +
            '        <di:waypoint x="1320" y="590" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1340" y="540" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0zdljvg_di" bpmnElement="SequenceFlow_0zdljvg">\n' +
            '        <di:waypoint x="1205" y="590" />\n' +
            '        <di:waypoint x="1130" y="590" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1163" y="572" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0cwwdaf_di" bpmnElement="SequenceFlow_0cwwdaf">\n' +
            '        <di:waypoint x="925" y="460" />\n' +
            '        <di:waypoint x="1030" y="460" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="964" y="463" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_03krq69_di" bpmnElement="ExclusiveGateway_03krq69" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="1345" y="435" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1405" y="446" width="77" height="27" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0g1f82o_di" bpmnElement="SequenceFlow_0g1f82o">\n' +
            '        <di:waypoint x="1370" y="485" />\n' +
            '        <di:waypoint x="1370" y="550" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1380" y="503" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1csip2t_di" bpmnElement="SequenceFlow_1csip2t">\n' +
            '        <di:waypoint x="1345" y="460" />\n' +
            '        <di:waypoint x="1130" y="460" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1246" y="442" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ExclusiveGateway_0sird3c_di" bpmnElement="ExclusiveGateway_0sird3c" isMarkerVisible="true">\n' +
            '        <dc:Bounds x="1055" y="335" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="968" y="353" width="77" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_19fiwc1_di" bpmnElement="SequenceFlow_19fiwc1">\n' +
            '        <di:waypoint x="1080" y="335" />\n' +
            '        <di:waypoint x="1080" y="140" />\n' +
            '        <di:waypoint x="1370" y="140" />\n' +
            '        <di:waypoint x="1370" y="220" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1220" y="122" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0nuz1bq_di" bpmnElement="SequenceFlow_0nuz1bq">\n' +
            '        <di:waypoint x="1105" y="360" />\n' +
            '        <di:waypoint x="1230" y="360" />\n' +
            '        <di:waypoint x="1230" y="300" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1164" y="342" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0bgk8b7_di" bpmnElement="SequenceFlow_0bgk8b7">\n' +
            '        <di:waypoint x="780" y="460" />\n' +
            '        <di:waypoint x="875" y="460" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ServiceTask_1t77qh6_di" bpmnElement="RT_sendDevice">\n' +
            '        <dc:Bounds x="1320" y="680" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_169z4nz_di" bpmnElement="ReceiveTask_1loxs2g">\n' +
            '        <dc:Bounds x="230" y="160" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1vliroy_di" bpmnElement="RT_reviewProductInfo">\n' +
            '        <dc:Bounds x="400" y="160" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1ctty9u_di" bpmnElement="RT_arrangeFAE">\n' +
            '        <dc:Bounds x="795" y="160" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1hol457_di" bpmnElement="RT_submitHWInfo">\n' +
            '        <dc:Bounds x="295" y="420" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_0r4mnk7_di" bpmnElement="RT_submitRecordedAudio">\n' +
            '        <dc:Bounds x="470" y="420" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_0s844s2_di" bpmnElement="ReceiveTask_079wsx8">\n' +
            '        <dc:Bounds x="1030" y="420" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1mafjd6_di" bpmnElement="RT_reviewHWInfo">\n' +
            '        <dc:Bounds x="1180" y="220" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_0gejv8t_di" bpmnElement="RT_provideCAE">\n' +
            '        <dc:Bounds x="1320" y="220" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1sj6axg_di" bpmnElement="ReceiveTask_023yrw4">\n' +
            '        <dc:Bounds x="1320" y="550" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_06vg9ns_di" bpmnElement="ReceiveTask_1mo6f0t">\n' +
            '        <dc:Bounds x="1030" y="550" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_0zxskp8_di" bpmnElement="RT_reviewDevice">\n' +
            '        <dc:Bounds x="660" y="540" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1mhzf6f_di" bpmnElement="ReceiveTask_0tjheug">\n' +
            '        <dc:Bounds x="460" y="540" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_1114h0r_di" bpmnElement="ServiceTask_16fss4z">\n' +
            '        <dc:Bounds x="240" y="540" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_04jfm5p_di" bpmnElement="RT_storeDevice">\n' +
            '        <dc:Bounds x="1030" y="730" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0vkobon_di" bpmnElement="SequenceFlow_0vkobon">\n' +
            '        <di:waypoint x="290" y="620" />\n' +
            '        <di:waypoint x="290" y="770" />\n' +
            '        <di:waypoint x="660" y="770" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0hccz50_di" bpmnElement="SequenceFlow_0hccz50">\n' +
            '        <di:waypoint x="870" y="605" />\n' +
            '        <di:waypoint x="870" y="670" />\n' +
            '        <di:waypoint x="700" y="670" />\n' +
            '        <di:waypoint x="700" y="730" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="774" y="647" width="11" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ParallelGateway_1kqz2q1_di" bpmnElement="ExclusiveGateway_05di7z3">\n' +
            '        <dc:Bounds x="925" y="745" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="917" y="721" width="66" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_053cnrr_di" bpmnElement="SequenceFlow_053cnrr">\n' +
            '        <di:waypoint x="975" y="770" />\n' +
            '        <di:waypoint x="1030" y="770" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ReceiveTask_0st5gqg_di" bpmnElement="ReceiveTask_0st5gqg">\n' +
            '        <dc:Bounds x="1030" y="890" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0qtgazi_di" bpmnElement="SequenceFlow_0qtgazi">\n' +
            '        <di:waypoint x="950" y="795" />\n' +
            '        <di:waypoint x="950" y="930" />\n' +
            '        <di:waypoint x="1030" y="930" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_0qxsidm_di" bpmnElement="SequenceFlow_0qxsidm">\n' +
            '        <di:waypoint x="1130" y="770" />\n' +
            '        <di:waypoint x="1230" y="770" />\n' +
            '        <di:waypoint x="1230" y="825" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1safbmu_di" bpmnElement="SequenceFlow_1safbmu">\n' +
            '        <di:waypoint x="1130" y="930" />\n' +
            '        <di:waypoint x="1230" y="930" />\n' +
            '        <di:waypoint x="1230" y="875" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ParallelGateway_0byqz4m_di" bpmnElement="ExclusiveGateway_14oe82k">\n' +
            '        <dc:Bounds x="1205" y="825" width="50" height="50" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1117" y="840" width="66" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNShape id="ServiceTask_04nl2xl_di" bpmnElement="ServiceTask_04nl2xl">\n' +
            '        <dc:Bounds x="1330" y="810" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1st7fgw_di" bpmnElement="SequenceFlow_1st7fgw">\n' +
            '        <di:waypoint x="1255" y="850" />\n' +
            '        <di:waypoint x="1330" y="850" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="EndEvent_0chl8lr_di" bpmnElement="EndEvent_0chl8lr">\n' +
            '        <dc:Bounds x="1512" y="832" width="36" height="36" />\n' +
            '        <bpmndi:BPMNLabel>\n' +
            '          <dc:Bounds x="1519" y="875" width="22" height="14" />\n' +
            '        </bpmndi:BPMNLabel>\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1buu5sa_di" bpmnElement="SequenceFlow_1buu5sa">\n' +
            '        <di:waypoint x="1430" y="850" />\n' +
            '        <di:waypoint x="1512" y="850" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '      <bpmndi:BPMNShape id="ServiceTask_1nyqqf7_di" bpmnElement="ServiceTask_1nyqqf7">\n' +
            '        <dc:Bounds x="660" y="730" width="100" height="80" />\n' +
            '      </bpmndi:BPMNShape>\n' +
            '      <bpmndi:BPMNEdge id="SequenceFlow_1d50lil_di" bpmnElement="SequenceFlow_1d50lil">\n' +
            '        <di:waypoint x="760" y="770" />\n' +
            '        <di:waypoint x="925" y="770" />\n' +
            '      </bpmndi:BPMNEdge>\n' +
            '    </bpmndi:BPMNPlane>\n' +
            '  </bpmndi:BPMNDiagram>\n' +
            '</bpmn:definitions>\n');
    });

    it('get tasks', async () => {
        const tasks = e.getTasks();
        ['硬件项目资料', '审核资料', '指定FAE', '等待归档','提交硬件结构资料是否有整机', '提供案例音频，音频测试', '音频测试', '提交编译链', '商务确认', '提供调试算法库', '提供整机音频', '整机音频测试', '整机测试', '已收到整机', '开始测试', '测试完成', '客户归档', '中台归档', '归档']
            .forEach(name => {
                console.log('to find', name);
                expect(tasks.find(t => t.name == name)).toBeTruthy()
            });
    });

    it('get task', async () => {
        {
            const task = e.getTaskByName('提交硬件结构资料是否有整机');
            expect(task.name).toEqual('提交硬件结构资料是否有整机');
            expect(task.isReceiveTask).toBeTruthy();
        }

        {
            const task = e.getTaskByName('音频测试');
            expect(task.name).toEqual('音频测试');
            expect(task.isServiceTask).toBeTruthy();
        }
    });

    it('all yes go', async () => {
        const varaibles = {
            审核资料: {data: {status: '通过'}},
            音频测试: {data: {status: '通过'}},
            商务确认: {data: {status: '通过'}},
            整机音频测试: {data: {status: '通过'}},
            提供调试算法库: {data: {status: '通过'}},
            整机测试: {data: {status: '通过'}},
        };
        let next = e.nextProcess({isStart: true}, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('硬件项目资料');

        next = e.nextProcess(next, varaibles, '审核资料');
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('审核资料');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('指定FAE');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提交硬件结构资料是否有整机');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供案例音频，音频测试');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('音频测试');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提交编译链');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供调试算法库');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供整机音频');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('整机音频测试');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('整机测试');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('已收到整机');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('开始测试');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('测试完成');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('等待归档');

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(2);
        expect(next).toContain(e.getTaskByName('客户归档'));
        expect(next).toContain(e.getTaskByName('中台归档'));

        next = e.nextProcess(next, varaibles);
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('归档');

        next = e.nextProcess(next, varaibles)[0];
        expect(next.isEnd).toEqual(true);
    });

    it('error if can not go', async () => {
        let next = e.nextProcess({isStart: true}, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('硬件项目资料');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('审核资料');

        try {
            next = e.nextProcess(next, {审核资料: {data: {status: '随便写点'}}});
            throw 'not here'
        } catch (e) {
            console.log(e);
            expect(e).not.toEqual('not here');
        }

        next = e.nextProcess(next, {审核资料: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('指定FAE');
    });

    it('stop at parallel gateway', async()=>{
        const dones = [e.getTaskByName('等待归档')];
        let next = e.nextProcess(dones, {});
        expect(next).toHaveLength(2);
        expect(next).toContain(e.getTaskByName('中台归档'));
        expect(next).toContain(e.getTaskByName('客户归档'));

        next = e.nextProcess(next[0], {});
        expect(next).toHaveLength(1);
        expect(next).toContain(e.getTaskByName('双方归档完成'));
        expect(next[0]).toHaveProperty('isParallelGateway', true);
    });

    it('every x fail once', async () => {
        let next = e.nextProcess({isStart: true}, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('硬件项目资料');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('审核资料');

        next = e.nextProcess(next, {审核资料: {data: {status: '不通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('硬件项目资料');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('审核资料');

        next = e.nextProcess(next, {审核资料: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('指定FAE');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提交硬件结构资料是否有整机');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供案例音频，音频测试');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('音频测试');

        next = e.nextProcess(next, {音频测试: {data: {status: '不通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供案例音频，音频测试');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('音频测试');

        next = e.nextProcess(next, {音频测试: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提交编译链');

        next = e.nextProcess(next, {商务确认: {data: {status: '等待'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('商务确认');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供调试算法库');

        next = e.nextProcess(next, {提供调试算法库: {data: {status: '不通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提交编译链');

        next = e.nextProcess(next, {商务确认: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供调试算法库');

        next = e.nextProcess(next, {提供调试算法库: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供整机音频');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('整机音频测试');

        next = e.nextProcess(next, {整机音频测试: {data: {status: '不通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('提供整机音频');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('整机音频测试');

        next = e.nextProcess(next, {整机音频测试: {data: {status: '通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isReceiveTask).toEqual(true);
        expect(next.name).toEqual('整机测试');

        next = e.nextProcess(next, {整机测试: {data: {status: '不通过'}}});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('等待归档');

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(2);
        expect(next).toContain(e.getTaskByName('客户归档'));
        expect(next).toContain(e.getTaskByName('中台归档'));

        next = e.nextProcess(next, {});
        expect(next.length).toEqual(1);
        next = next[0];
        expect(next.isServiceTask).toEqual(true);
        expect(next.name).toEqual('归档');

        next = e.nextProcess(next, {})[0];
        expect(next.isEnd).toEqual(true);
    });
});
