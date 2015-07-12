import {expect} from 'chai';
import Section from '../../src/section';

describe('Section', () => {
  describe('#appendText', () => {
    it('should only insert space between english word and other words', () => {
      const englishSection = new Section('English', 1, []),
            englishSection2 = new Section('English', 2, []),
            chineseSection = new Section('中文', 1, []),
            chineseSection2 = new Section('中文', 2, []);

      englishSection.appendText('english');
      expect(englishSection.text).to.equal('English english');

      englishSection2.appendText('中文');
      expect(englishSection2.text).to.equal('English 中文');

      chineseSection.appendText('english');
      expect(chineseSection.text).to.equal('中文 english');

      chineseSection2.appendText('呢');
      expect(chineseSection2.text).to.equal('中文呢');
    });
  });
});
