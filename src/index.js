import LineMachine from './lineMachine';

export default function parse(pdfData, options = {}) {
  const startPage = options.start || 1,
        endPage   = options.end || pdfData.length,
        machine = new LineMachine(options.indent);

  for (let pageIdx = startPage - 1; pageIdx < endPage; pageIdx += 1) {
    let page = pdfData[pageIdx];
    page.words.forEach((word) => {
      if (word.yMax < options.header || word.yMin > options.footer) {
        // Skip word if in header or footer
        return;
      }

      // y coordinate must be inverted, since PDF.js uses bottom-left as (0,0).
      machine.push(word.text, pageIdx + 1, [word.xMin, page.height - word.yMin]);
    });
  }

  return machine.getOutput();
};
