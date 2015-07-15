import {expect} from 'chai';
import Section from '../../src/section';
import util from '../../src/util';

describe('util', () => {
  describe('#convertToCSV', () => {
    it('should generate CSV from given data, with nearest title\'s coordinates', () => {
      const input = [
        new Section('Top level text', 1, [0, 0]),
        new Section('Title of 壹', 1, [0, 20], '壹'),
        new Section('Title of 貳', 3, [0, 0], '貳')
      ]

      input[1].items = [
        new Section('Text of 壹', 1, [0, 40])
      ];

      input[2].items = [
        new Section('Title of 貳、一', 3, [0, 10], '一')
      ];

      input[2].items[0].items = [
        new Section('Title of 貳、一、（一）', 3, [10, 20], '一')
      ];

      // Read as title without content so that the behavior can be more
      // consistent.
      //
      input[2].items[0].items[0].items = [
        new Section('Title of 貳、一、（一）1.', 3, [20, 30], '1')
      ];

      return util.convertToCSV(input).then(output => {
        expect(output).to.equal([
          ',,,,,,,1,0,0,Top level text',
          ',Title of 壹,,,,,,1,0,20,Text of 壹',
          ',Title of 貳,Title of 貳、一,Title of 貳、一、（一）,Title of 貳、一、（一）1.,,,3,20,30,',
          ''
        ].join('\n'));
      });
    });
  });
});
