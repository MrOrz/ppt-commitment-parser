import csvStringify from 'csv-stringify';

function convertToCSV(data) {
  var sectionStack = [],
      rows = [];

  function traverse(items) {
    if (items.length > 0) {
      items.forEach(section => {
        // Keep traversing
        //
        sectionStack.push(section);
        traverse(section.items);
        sectionStack.pop();
      });

    } else {
      // "Leaf" node, output sectionStack to rows[]
      //
      let fullTitleArray = ['', '', '', '', '', ''],
          lastSection = sectionStack[sectionStack.length - 1],
          text, titleStack;

      if (!lastSection.hasTitle()) {
        // Last section was normal content.
        //
        text = lastSection.text;
        titleStack = sectionStack.slice(0, -1); // exclude last section from title
      } else {
        // Last section was a title as well.
        //
        text = '';
        titleStack = sectionStack;
      }

      // Fill up title0 ~ title5.
      // Leave blank ('') for titles that's too deep or too shallow.
      //
      titleStack.forEach(({text}, idx) => {
        fullTitleArray[idx] = text;
      });

      // Use "last title" as the coordinate if possible.
      //
      let outputCoord;
      if (titleStack.length) {
        outputCoord = titleStack[titleStack.length - 1].coord;
      } else {
        outputCoord = lastSection.coord;
      }

      // title0 ~ title5, page, coordinate, text
      rows.push(fullTitleArray.concat(lastSection.page, outputCoord, text));
    }

  }

  traverse(data);

  return new Promise((resolve, reject) => {
    csvStringify(rows, (err, csv) => {
      if (err) {reject(err);} else {resolve(csv);}
    })
  });
}

export default {convertToCSV}
