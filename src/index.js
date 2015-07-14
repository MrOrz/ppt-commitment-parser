import LineMachine from './lineMachine';

// The threshold to determine if the space to the left and right of a paragraph
// is near enough. If so, the paragraph is probably centered.
//
const CENTER_DIFFERENCE_RATIO = 0.1;

export default function parse(pdfData, options = {}) {
  const startPage = options.start || 1,
        endPage   = options.end || pdfData.length,
        machine = new LineMachine(options);

  for (let pageIdx = startPage - 1; pageIdx < endPage; pageIdx += 1) {
    let page = pdfData[pageIdx];
    page.words.forEach((word) => {
      if (word.yMax < options.header || word.yMin > options.footer) {
        // Skip word if in header or footer
        return;
      }

      const leftSpace = word.xMin,
            rightSpace = page.width - word.xMax,
            isCentered = Math.abs(leftSpace - rightSpace) / Math.min(leftSpace, rightSpace) <
                         CENTER_DIFFERENCE_RATIO

      // y coordinate must be inverted, since PDF.js uses bottom-left as (0,0).
      machine.push(word.text, pageIdx + 1, [word.xMin, page.height - word.yMin],
                   isCentered);
    });
  }

  return machine.getOutput();
};
