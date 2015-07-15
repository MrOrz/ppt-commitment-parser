// Consumes each line and constructs article structure
//

import {parseZHNumber} from 'zhutil';
import Section from './section';

const TITLE_NUMBER_HIERARCHY = [
    /^([〇零壹貳參叄叁肆伍陸柒捌玖拾佰仟]+)\s?[、\.]/,      // level 0
    /^([〇零一兩二三四五六七八九十百千]+)\s?[、\.]/,      // level 1
    /^[(（]\s?([〇零一兩二三四五六七八九十百千]+)\s?[)）]/,  // level 2
    /^(\d+|[０-９]+)\s?[、\.]/,                     // level 3
    /^[(（]\s?(\d+|[０-９]+)\s?[)）]/,                 // level 4
    /^([甲乙丙丁戊己庚辛壬癸a-zａ-ｚA-ZＡ-Ｚ])\s?[、\.]/,// level 5
  ],
  HIERARCHY_NAMES = [
    '%s、', '%s、', '（%s）', '%s、', '(%s)', '%s、'
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
    this._shouldDetectCenteredTitle = options.center;
    this._shouldPrintError = !options.quiet;
    this._onError = (options.onError && options.onError.bind(this)) || this.onError;
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
    var errors = [];

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
        errors.push(this._onError('LEVEL_MISMATCH', {
          text, page, coord, level, lastLevel: this._getCurrentTitleLevel(),
          numberCH
        }));

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
          errors.push(this._onError('NUMBER_MISMATCH', {
            text, page, number, lastSiblingSection
          }));
        }
      } else if (number !== 1) {
        // If no sibling has no title,
        // Current title's number should be 1
        //
        errors.push(this._onError('NUMBER_MISMATCH', {
          text, page, number
        }));
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

    if (errors.length) {
      this._getCurrentSection().errors = errors;
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
      // 甲乙丙丁 or ABCD or full-width ABCD
      if (input.match(/[a-zA-Z]/)) {
        number = input.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) + 1;
      } else if (input.match(/[ａ-ｚＡ-Ｚ]/)) {
        number = input.toLowerCase().charCodeAt(0) - 'ａ'.charCodeAt(0) + 1;
      } else {
        number = HEAVENSTEM_NUMBER_MAP[input];
      }
    }

    if (isNaN(number)) {
      this._onError('PARSE_NUM', {input, level: titleLevel});
    }

    return number;
  }

  // Default onError callback.
  // Returns error message to append in the JSON structure.
  // This method is made public so that custom error callback can invoke this
  // default method when necessary.
  //
  onError(type, err) {
    var msg;

    switch (type){
    case 'PARSE_NUM':
      msg = `[Error]「${err.input}」無法轉成數字。`;
      break;

    case 'LEVEL_MISMATCH':
      if (err.lastLevel === -1) { // top level
        msg = `[Warning] 「${err.text}」（p${err.page}）的文章標號從「${this._getHierarchyNotation(err.level, err.numberCH)}」開始，不符合標號階層。`;
      } else {
        let section = this._getCurrentSection();
        if (section.numberCH) {
          msg = `[Warning] 文章階層有誤：「${err.text}」（p${err.page}）文章標號為「${this._getHierarchyNotation(err.level, err.numberCH)}」，但前文標號為「${this._getHierarchyNotation(err.lastLevel, section.numberCH)}」。`;
        }else {
          msg = `[Warning] 文章階層有誤：「${err.text}」（p${err.page}）文章標號為「${this._getHierarchyNotation(err.level, err.numberCH)}」，但前文階層為 ${err.lastLevel}。`;
        }
      }
      break;

    case 'NUMBER_MISMATCH':
      if (!err.lastSiblingSection) {
        msg = `[Warning] 標號有誤：「${err.text}」（p${err.page}）標號為 ${err.number}，但此標題應為該層的第 1 個標題。`;
      }else {
        msg = `[Warning] 標號有誤：「${err.text}」（p${err.page}）標號為 ${err.number}，但同階層的前一個標號為 ${err.lastSiblingSection.number}（p${err.lastSiblingSection.page}）。`;
      }
      break;

    default:
      msg = `[Error] Unknown error ${JSON.stringify(err)}`;
    }

    if (this._shouldPrintError) {
      console.error(msg);
    }

    return msg;
  }

  _getHierarchyNotation(level, numberCH) {
    return HIERARCHY_NAMES[level].replace('%s', numberCH);
  }
}

export default LineMachine;
