class Section {
  constructor(text, page, coord, numberCH = null) {
    if (numberCH) {
      this.numberCH = numberCH;
    }
    this.text = text;
    this.page = page;
    this.coord = coord.slice(0);
    this.items = [];
  }

  appendText(textToAppend) {
    if (!textToAppend) {return;}

    // If the last character of current text or the first character contains
    // English, add a space between old and new pieces of text.
    //
    if (this.text.slice(-1).match(/\w/) || textToAppend[0].match(/\w/)) {
      this.text += ' ';
    }

    this.text += textToAppend;
  }

  // Return whether this section has title
  hasTitle() {
    return !!this.numberCH;
  }

  getLastItem() {
    return this.items[this.items.length - 1];
  }
}

export default Section;
