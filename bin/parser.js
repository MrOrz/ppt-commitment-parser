#!/usr/bin/env node

var parser = require('../lib'),
    util = require('../lib/util'),
    fs = require('fs'),
    pdftojson = require('pdftojson'),
    argv = require('yargs')
      .usage('Usage: $0 <options> inputFile.<pdf|json>')
      .version(function() {return require('../package').version})
      .help('help')
      .options({
        s: {
          alias: 'start',
          describe: '要處理的第一頁。頁碼從 1 開始。',
          default: 0,
          type: 'Number'
        },
        e: {
          alias: 'end',
          describe: '要處理的最後一頁。頁碼從 1 開始。',
          default: 0,
          type: 'Number'
        },
        i: {
          alias: 'indent',
          describe: '最小標題的左側縮排，以 pt 為單位。在縮排線右邊的文字將不會被判定為標題。',
          default: Infinity,
          type: 'Number'
        },
        c: {
          alias: 'center',
          describe: '除左側標題外，也對置中的文字判定是否為標題。',
          default: false,
          type: 'boolean'
        },
        h: {
          alias: 'header',
          describe: '頁首底邊位置，以 pt 為單位，頁面最上緣為 0。此線以上的所有文字都會被忽略。',
          default: 0,
          type: 'Number'
        },
        f: {
          alias: 'footer',
          describe: '頁尾頂邊位置，以 pt 為單位，頁面最上緣為 0。此線以下的所有文字都會被忽略。',
          default: Infinity,
          type: 'Number'
        }
      })
      .nargs({
        o: 1,
        c: 1
      })
      .example('$0 YourPDF.pdf', '生成 YourPDF.csv')
      .example('$0 YourPDF.json', '從 YourPDF.json（pdftojson 的產物）生成 YourPDF.csv')
      .example('$0 -o test.csv YourPDF.pdf', '從 YourPDF.pdf 生成 test.csv')
      .demand(1, 1)
      .argv,

    inputFileName = argv._[0],
    csvFileName = argv.output || inputFileName.replace(/\.(?:pdf|json)$/i, '.csv');

if (inputFileName.endsWith('.json')) {
  util.convertToCSV(parser(require(process.cwd() + '/' + inputFileName), argv))
  .then(function(csvData) {
    fs.writeFileSync(csvFileName, csvData);
    console.log('Saved to', csvFileName);
  });
} else {
  pdftojson(inputFileName).then(function(pdfData) {
    return util.convertToCSV(parser(pdfData, argv));
  }).then(function(csvData) {
    fs.writeFileSync(csvFileName, csvData);
    console.log('Changed and saved to', csvFileName);
  });
}
