// Consumes each line and constructs article structure
//

import {parseZHNumber} from 'zhutil';
import Section from './section';

const TITLE_NUMBER_HIERARCHY = [
    /^([〇零壹貳參叄肆伍陸柒捌玖拾佰仟]+)\s?[、,\.，]/,     // level 0
    /^([〇零一兩二三四五六七八九十百千]+)\s?[、,\.，]/,     // level 1
    /^[(（]\s?([〇零一兩二三四五六七八九十百千]+)\s?[)）]/, // level 2
    /^(\d+|[０１２３４５６７８９]+)\s?[、,\.，]/,         // level 3
    /^[(（]\s?(\d+|[０１２３４５６７８９]+)\s?[)）]/,     // level 4
    /^([甲乙丙丁戊己庚辛壬癸])\s?[、,\.，]/,              // level 5
  ],
  TITLE_NUMBER_HIERARCHY_COUNT = TITLE_NUMBER_HIERARCHY.length,
  FULLWIDTH_NUMBER_MAP = {
    '０': 0, '１': 1, '２': 2, '３': 3, '４': 4,
    '５': 5, '６': 6, '７': 7, '８': 8, '９': 9
  },
  HEAVENSTEM_NUMBER_MAP = {
    '甲': 1, '乙': 2, '丙': 3, '丁': 4, '戊': 5,
    '己': 6, '庚': 7, '辛': 8, '壬': 9, '癸': 10
  },
  NOOP = function() {};

class LineMachine {
  constructor(options = {}) {
    this._output = [];
    this._sectionStack = []; // Level stack, each level one section
    this._indent = options.indent || Infinity;
    this._shouldDetectCenteredTitle = options.center || false;
    if (options.quiet && !options.onError) {
      this._onError = NOOP;
    }else {
      this._onError = options.onError || this.onError;
    }
  }

  _getCurrentSection() {
    var section = this._sectionStack[this._getCurrentTitleLevel()]
    if (!section) {
      throw 'No current section!';
    }
    return section;
  }

  _getCurrentTitleLevel() {
    return this._sectionStack.length - 1;
  }

  _hasCurrentSection() {
    return this._sectionStack.length > 0;
  }

  _appendAndDiveIntoSection(section) {
    // Append the given section to current section's items,
    // and go into the given secion (set it as current section).

    if (!this._hasCurrentSection()) {
      this._output.push(section);
      this._sectionStack.push(section);
    } else {
      this._getCurrentSection().items.push(section);
      this._sectionStack.push(section);
    }
  }

  _popFromCurrentSection() {
    this._sectionStack.pop();
  }

  push(text, page, coord, isCentered = false) {
    const {level, numberCH, number, text: title} = this._extractTitleLevelAndNumbers(text);

    if ((coord[0] <= this._indent || (this._shouldDetectCenteredTitle && isCentered)) &&
        level !== -1) {
      // New section detected.
      //

      // Adjust current stack to one-level shallower than
      // the detected level. (i.e. the detected level's parent)
      //
      while (this._getCurrentTitleLevel() > level - 1) {
        // Too deep, do popping
        this._popFromCurrentSection();
      }

      if (this._getCurrentTitleLevel() < level - 1) {
        // Too shallow, add some padding sections.
        // TODO: give warnings here, since this often means a mistake in structure.
        //
        this._onError('LEVEL_MISMATCH', {
          text, page, coord, level, lastLevel: this._getCurrentTitleLevel()
        });

        while (this._getCurrentTitleLevel() < level - 1) {

          let paddingSection = new Section('', page, coord);
          this._appendAndDiveIntoSection(paddingSection);
        }
      }

      // Check if numbering continues with last sibling section.
      //
      let lastSiblingSection;
      if (this._getCurrentTitleLevel() === -1) { // Top level
        lastSiblingSection = this._output[this._output.length - 1];
      } else {
        let siblingSections = this._getCurrentSection().items;
        lastSiblingSection = siblingSections[siblingSections.length - 1];
      }

      if (lastSiblingSection && lastSiblingSection.number) {
        // Have sibling section that has title.
        // Number should succeed the previous section.

        if (lastSiblingSection.number !== number - 1) {
          this._onError('NUMBER_MISMATCH', {
            text, page, number, lastNumber: lastSiblingSection.number
          });
        }
      } else if (number !== 1) {
        // If no sibling has no title,
        // Current title's number should be 1
        //
        this._onError('NUMBER_MISMATCH', {
          text, page, number, lastNumber: 0
        });
      }

      let titleParts = title.split(/[:：]/);
      if (titleParts.length > 1) {
        // The part prior to colon symbol is the real title,
        // others are text.

        let titlePart = titleParts[0].trim(),
            textPart = title.slice(titlePart.length + 1).trim(); // +1 to skip colon character

        this._appendAndDiveIntoSection(new Section(titlePart, page, coord, numberCH, number));
        this._appendAndDiveIntoSection(new Section(textPart, page, coord));

      } else {
        // Just add the title
        this._appendAndDiveIntoSection(new Section(title, page, coord, numberCH, number));
      }

    } else {
      // Not title, should be normal text
      //

      if (!this._hasCurrentSection() || this._getCurrentSection().hasTitle()) {
        // These two cases that needs to create new section that contains pure text
        // and no title.
        //

        this._appendAndDiveIntoSection(new Section(text, page, coord));
      } else {
        // Just some more text for current section.
        //
        this._getCurrentSection().appendText(text);
      }

    }

  }

  getOutput() {
    return this._output;
  }

  _extractTitleLevelAndNumbers(text) {
    var level, match;
    text = text.trim();
    for (level = TITLE_NUMBER_HIERARCHY_COUNT - 1; level >= 0 ; level -= 1) {
      if (match = TITLE_NUMBER_HIERARCHY[level].exec(text)) {
        return {
          level,
          numberCH: match[1],
          number: this._parseNumber(match[1], level),
          text: text.slice(match[0].length).trim() // text after numbering
        };
      };
    }
    return {level}; // {level: -1} for non-titles
  }

  _parseNumber(input, titleLevel) {
    var number = 0 ;
    if (titleLevel <= 2) {
      number = parseZHNumber(input);
    } else if (titleLevel <= 4) {
      if (input.match(/\d+/)) {
        number = +input;
      } else {
        let inputLength = input.length;
        for (let i = 0; i < inputLength; i += 1) {
          number = 10 * number + FULLWIDTH_NUMBER_MAP[input[i]];
        }
      }
    } else {
      // 甲乙丙丁
      number = HEAVENSTEM_NUMBER_MAP[input];
    }

    if (isNaN(number)) {
      this._onError('PARSE_NUM', {input, level: titleLevel});
    }

    return number;
  }

  onError(type, err) {
    switch (type){
    case 'PARSE_NUM':
      console.error('[Error] Number parsing error: ', err.input);
      break;

    case 'LEVEL_MISMATCH':
      console.error(`[Warning] Level mismatch: Line "${err.text}" @ p${err.page} is at level ${err.level},
        but last line was at level ${err.lastLevel}.`);
      break;

    case 'NUMBER_MISMATCH':
      console.error(`[Warning] Number mismatch: Title "${err.text}" @ p${err.page} has number ${err.number}
        but the last title number in this level is ${err.lastNumber}`);
      break;
    }

  }
}

export default LineMachine;
