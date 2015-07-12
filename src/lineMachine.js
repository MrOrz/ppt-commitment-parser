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
], TITLE_NUMBER_HIERARCHY_COUNT = TITLE_NUMBER_HIERARCHY.length

class LineMachine {
  constructor(indent = Infinity) {
    this._output = [];
    this._sectionStack = [];
    this._indent = indent;
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

  _hasNoCurrentSection() {
    return this._sectionStack.length === 0;
  }

  _appendAndDiveIntoSection(section) {
    // Append the given section to current section's items,
    // and go into the given secion (set it as current section).

    if (this._hasNoCurrentSection()) {
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

  push(text, page, coord) {
    const {level, digits, text: title} = this._extractTitleLevelAndDigits(text);

    if (coord[0] <= this._indent && level !== -1) {
      // New section detected.
      //
      let newSection = new Section(title, page, coord, digits);

      // Adjust current stack to one-level shallower than
      // the detected level. (i.e. the detected level's parent)
      //
      while (this._getCurrentTitleLevel() > level - 1) {
        // Too deep, do popping
        this._popFromCurrentSection();
      }

      while (this._getCurrentTitleLevel() < level - 1) {
        // Too shallow, add some padding sections.
        // TODO: give warnings here, since this often means a mistake in structure.
        //
        let paddingSection = new Section('', page, coord);
        this._appendAndDiveIntoSection(paddingSection);
      }

      this._appendAndDiveIntoSection(newSection);

    } else {

      if (this._hasNoCurrentSection() || this._getCurrentSection().hasTitle()) {
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

  _extractTitleLevelAndDigits(text) {
    var level, match;
    text = text.trim();
    for (level = TITLE_NUMBER_HIERARCHY_COUNT - 1; level >= 0 ; level -= 1) {
      if (match = TITLE_NUMBER_HIERARCHY[level].exec(text)) {
        return {
          level,
          digits: match[1],
          text: text.slice(match[0].length).trim() // text after numbering
        };
      };
    }
    return {level}; // {level: -1} for non-titles
  }
}

export default LineMachine;
