import utils from './utils';
import LineMachine from './lineMachine';

export default function parse(pdfData, options) {
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

      machine.push(word.text, pageIdx + 1, [word.xMin, word.yMin]);
    });
  }

  return machine.getOutput();

  function isHeaderOrFooter (word) {
    return ;
  }

};
