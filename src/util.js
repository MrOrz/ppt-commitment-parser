import csvStringify from 'csv-stringify';

function convertToCSV(data) {
  var titleStack = [],
      rows = [];

  function traverse(items) {
    items.forEach(section => {
      var fullTitleArray = ['', '', '', '', '', ''];
      if (section.items.length === 0) {
        // "Leaf" node, output to rows[]
        //

        // Build title0 ~ title5.
        // Leave blank ('') for titles that's too deep or too shallow.
        //
        titleStack.forEach((title, idx) => {
          fullTitleArray[idx] = title;
        });

        // title0 ~ title5, page, coordinate, text
        rows.push(fullTitleArray.concat(section.page, section.coord, section.text));
      } else {
        // Keep traversing
        //
        titleStack.push(section.text);
        traverse(section.items);
        titleStack.pop();
      }
    });
  }

  traverse(data);

  return new Promise((resolve, reject) => {
    csvStringify(rows, (err, csv) => {
      if (err) {reject(err);} else {resolve(csv);}
    })
  });
}

export default {convertToCSV}
