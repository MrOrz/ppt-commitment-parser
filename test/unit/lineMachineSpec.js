import {expect} from 'chai';
import LineMachine from '../../src/lineMachine';

describe('LineMachine', () => {
  describe('#_extractTitleLevelAndDigits', () => {
    it('should extract correct level, text and digits', () => {
      const machine = new LineMachine(),
            testMap = {
              '一二三這是文字、不是標題': {level: -1},
              '見(一)這是文字、不是標題': {level: -1},
              '拾壹. 標題': {level: 0, digits: '拾壹', text: '標題'},
              '十 、標題': {level: 1, digits: '十', text: '標題'},
              '兩百零一、標題': {level: 1, digits: '兩百零一', text: '標題'},
              '（一〇） 標題': {level: 2, digits: '一〇', text: '標題'},
              '３１、415': {level: 3, digits: '３１', text: '415'},
              '(21) 34': {level: 4, digits: '21', text: '34'},
              '甲、乙': {level: 5, digits: '甲', text: '乙'}
            };

      Object.keys(testMap).forEach(test => {
        expect(machine._extractTitleLevelAndDigits(test)).to.deep.equal(testMap[test]);
      });
    });
  });

  it('should accept and joins top-level text', () => {
    const machine = new LineMachine();
    machine.push('Line No. 1', 1, [0, 0]);
    machine.push('Line No. 2', 2, [0, 0]);

    const output = machine.getOutput();
    expect(output).to.have.length(1);
    expect(output[0]).to.deep.equal({
      text: 'Line No. 1 Line No. 2',
      page: 1,
      coord: [0, 0], // Use the first word's coord
      items: []
    });
  });

  it('should progress as new same-level title is given', () => {
    const machine = new LineMachine();
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
    const machine = new LineMachine();
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
    const machine = new LineMachine();
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
    const machine = new LineMachine();
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
    const machine = new LineMachine(10);
    machine.push('壹、Title No. 1', 1, [10, 10]); // should be title
    machine.push('貳、Fake', 1, [11, 20]); // should not be title
    machine.push('貳、Title No. 2', 1, [0, 30]); // should be title

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(2);
    expect(output[1].text).to.equal('Title No. 2');
  });

  it('should support centered title', () => {
    const machine = new LineMachine(10, true);
    machine.push('壹、Title No. 1', 1, [40, 10], true); // should be title
    machine.push('貳、Fake', 1, [11, 20], false);       // should not be title

    const output = machine.getOutput();
    expect(output, 'output').to.have.length(1);
    expect(output[0].text).to.equal('Title No. 1');
  });

  it('should give warning when the title progression is not reasonable');
});
