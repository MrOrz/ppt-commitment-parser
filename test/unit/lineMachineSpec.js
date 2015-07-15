import {expect} from 'chai';
import {spy} from 'sinon';

import LineMachine from '../../src/lineMachine';

describe('LineMachine', () => {
  describe('#_extractTitleLevelAndNumbers', () => {
    it('should extract correct level, text and numbers', () => {
      const machine = new LineMachine({quiet: true}),
            testMap = {
              '一二三這是文字、不是標題': {level: -1},
              '見(一)這是文字、不是標題': {level: -1},
              '拾壹. 標題': {level: 0, numberCH: '拾壹', number: 11, text: '標題'},
              '叁、教 育': {level: 0, numberCH: '叁', number: 3, text: '教 育'},
              '十 、標題': {level: 1, numberCH: '十', number: 10, text: '標題'},
              '兩百零一、標題': {level: 1, numberCH: '兩百零一', number: 201, text: '標題'},
              '（十一） 標題': {level: 2, numberCH: '十一', number: 11, text: '標題'},
              '３１、415': {level: 3, numberCH: '３１', number: 31, text: '415'},
              '(21) 34': {level: 4, numberCH: '21', number: 21, text: '34'},
              '甲、乙': {level: 5, numberCH: '甲', number: 1, text: '乙'},
              'Ａ.apple': {level: 5, numberCH: 'Ａ', number: 1, text: 'apple'},
              'a.apple': {level: 5, numberCH: 'a', number: 1, text: 'apple'},
            };

      Object.keys(testMap).forEach(test => {
        expect(machine._extractTitleLevelAndNumbers(test)).to.deep.equal(testMap[test]);
      });
    });
  });

  it('should accept and joins top-level text', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('Line No. 1', 1, [0, 0]);
    machine.push('Line No. 2', 2, [0, 0]);

    const output = machine.getOutput();
    expect(output).to.have.length(1);
    expect(output[0]).to.deep.equal({
      text: 'Line No. 1 Line No. 2',
      page: 1,
      coord: [0, 0], // Use the first word's coord
      items: [],
      errors: []
    });
  });

  it('should progress as new same-level title is given', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('壹、Title No. 1', 1, [0, 10]);
    machine.push('貳、Title No. 2', 1, [0, 20]);
    machine.push('一、Title No. 2-1', 1, [0, 30]);
    machine.push('二、Title No. 2-2', 1, [0, 40]);

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(2);
    expect(output.map(s=>s.text)).to.deep.equal([
      'Title No. 1', 'Title No. 2'
    ]);

    expect(output[1].items, 'output[0].items').to.have.length(2);
    expect(output[1].items.map(s=>s.text)).to.deep.equal([
      'Title No. 2-1', 'Title No. 2-2'
    ]);
  });

  it('should accept shallower title', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('壹、Title No. 1', 1, [0, 10]);
    machine.push('一、Title No. 1-1', 1, [0, 20]);
    machine.push('（一） Title No. 1-1-1', 1, [0, 30]);
    machine.push('二、Title No. 1-2', 1, [0, 40]);
    machine.push('貳、Title No. 2', 1, [0, 50]);

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(2);
    expect(output.map(s=>s.text)).to.deep.equal([
      'Title No. 1', 'Title No. 2'
    ]);

    expect(output[0].items, 'output[0].items').to.have.length(2);
    expect(output[0].items.map(s=>s.text)).to.deep.equal([
      'Title No. 1-1', 'Title No. 1-2'
    ]);

    expect(output[0].items[0].items, 'output[0].items[0].items').to.have.length(1);
    expect(output[0].items[0].items[0].text).to.equal('Title No. 1-1-1');
  });

  it('should accept title and deepen the structure', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('壹、Title No. 1', 1, [0, 10]);
    machine.push('Content under 壹', 1, [0, 20]);
    machine.push('一、Title No. 1-1', 1, [0, 30]);
    machine.push('(一) Title No. 1-1-1', 1, [0, 40]);

    const output = machine.getOutput();
    expect(output).to.have.length(1);
    expect(output[0].text).to.equal('Title No. 1');
    expect(output[0].items).to.have.length(2);
    expect(output[0].items.map(s => s.text)).to.deep.equal([
      'Content under 壹', 'Title No. 1-1']);
    expect(output[0].items[1].items).to.have.length(1);
    expect(output[0].items[1].items[0].text).to.equal('Title No. 1-1-1');
  });

  it('should progress top-level titles and put text as child items', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('Line No. 1', 1, [0, 0]);
    machine.push('壹、Title No. 1', 1, [0, 10]);

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(2);
    expect(output[0].text).to.equal('Line No. 1');
    expect(output[1].text).to.equal('Title No. 1');
    expect(output[1].numberCH).to.equal('壹');

    machine.push('Content under 壹', 1, [0, 20]);
    expect(output, 'output (2)').to.have.length(2);
    expect(output[1].text).to.equal('Title No. 1'); // Check if output[1] got changed by accident
    expect(output[1].items, 'output[1]').to.have.length(1);
    expect(output[1].items[0].text).to.equal('Content under 壹');

    machine.push('Another content under 壹', 1, [0, 30]);
    expect(output[1].items, 'output[1].items').to.have.length(1);
    expect(output[1].items[0].text).to.equal('Content under 壹 Another content under 壹');

    machine.push('貳、Title No. 2', 1, [0, 40]);
    expect(output, 'output (3)').to.have.length(3);
    expect(output[2].text).to.equal('Title No. 2');
    expect(output[2].numberCH).to.equal('貳');
  });

  it('should not make words behind the indent to become a title', () => {
    const machine = new LineMachine({indent: 10, quiet: true});
    machine.push('壹、Title No. 1', 1, [10, 10]); // should be title
    machine.push('貳、Fake', 1, [11, 20]); // should not be title
    machine.push('貳、Title No. 2', 1, [0, 30]); // should be title

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(2);
    expect(output[1].text).to.equal('Title No. 2');
  });

  it('should support centered title', () => {
    const machine = new LineMachine({indent: 10, center: true, quiet: true});
    machine.push('壹、Title No. 1', 1, [40, 10], true); // should be title
    machine.push('貳、Fake', 1, [11, 20], false);       // should not be title

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(1);
    expect(output[0].text).to.equal('Title No. 1');
  });

  it('should move text after colons to child items in title', () => {
    const machine = new LineMachine({quiet: true});
    machine.push('1、全形冒號：這些應該要在內文', 1, [0, 0]);
    machine.push('2、半形冒號: 這是 2 的內文', 1, [0, 20]);
    machine.push('還有這也是', 1, [10, 40]);

    const output = machine.getOutput();
    //            壹       一      （一）
    expect(output[0].items[0].items[0].items, 'output[0].items[0].items[0].items').to.have.length(2);
    expect(output[0].items[0].items[0].items.map(s => s.text)).to.deep.equal([
      '全形冒號', '半形冒號'
    ]);

    //            壹       一      （一）      1
    expect(output[0].items[0].items[0].items[0].items[0].text).to.equal('這些應該要在內文');
    //            壹       一      （一）      2
    expect(output[0].items[0].items[0].items[1].items[0].text).to.equal('這是 2 的內文還有這也是');
  })

  it('should give warning when the title progression is not reasonable', () => {
    const machine = new LineMachine({quiet: true}),
          onError = spy(machine, '_onError');

    // Test NUMBER_MISMATCH at top level
    //
    machine.push('Top-level text', 1, [0, 0]);
    machine.push('壹、中文', 1, [0, 10]);
    expect(onError).to.have.not.been.called;

    machine.push('參、跳號', 1, [0, 10]);
    expect(onError).to.have.been.calledWith('NUMBER_MISMATCH');
    expect(onError).to.have.been.calledOnce; // Only once
    onError.reset();

    // Test LEVEL_MISMATCH
    //
    machine.push('一、', 1, [0, 10]);
    expect(onError).have.not.been.called;

    machine.push('1、', 1, [0, 10]); // Level 1 -> level 3
    expect(onError).have.been.calledOnce;
    expect(onError).have.been.calledWith('LEVEL_MISMATCH');
    expect(onError.getCall(0).args[1].lastLevel).to.equal(1);
    onError.reset();

    // Test NUMBER_MISMATCH on non-top level
    //
    machine.push('2、', 1, [0, 10]); // Level 1 -> level 3
    expect(onError).have.not.been.called;
    machine.push('4、', 1, [0, 10]); // Level 1 -> level 3
    expect(onError).have.been.calledWith('NUMBER_MISMATCH');
    expect(onError).have.been.calledOnce; // Only once
    onError.reset();

    // Test NUMBER_MISMATCH for parent
    //
    machine.push('伍、', 1, [0, 10]);
    expect(onError).have.been.calledOnce;
    expect(onError).have.been.calledWith('NUMBER_MISMATCH');
    onError.reset();

    // Test NUMBER_MISMATCH for child
    //
    machine.push('二、', 1, [0, 10]);
    expect(onError).have.been.calledWith('NUMBER_MISMATCH');
    expect(onError).have.been.calledOnce; // Only once
  });
});
