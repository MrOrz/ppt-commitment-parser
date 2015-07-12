#!/usr/bin/env node

var parser = require('../lib'),
    argv = require('yargs')
      .usage('Usage: $0 <options> PDF檔名')
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
          default: Infinity,
          type: 'Number'
        },
        i: {
          alias: 'indent',
          describe: '最小標題的左側縮排，以 pt 為單位。在縮排線右邊的文字將不會被判定為標題。',
          default: Infinity,
          type: 'Number'
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
      .example('$0 -o test.csv YourPDF.pdf', '從 YourPDF.pdf 生成 test.csv')
      .demand(1, 1)
      .argv,

    pdfFileName = argv._[0],
    csvFileName = argv.output || pdfFileName.replace(/\.pdf$/i, '.csv');
