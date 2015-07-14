ppt-commitment-parser
=====================

[![Build Status](https://travis-ci.org/g0v/ppt-commitment-parser.svg)](https://travis-ci.org/g0v/ppt-commitment-parser) [![Coverage Status](https://coveralls.io/repos/g0v/ppt-commitment-parser/badge.svg?branch=master&service=github)](https://coveralls.io/github/g0v/ppt-commitment-parser?branch=master)

將施政報告或施政綱要 PDF 轉換成 CSV 的工具。
PDF 檔必須要用公文書格式進行標號（階層依序為「壹、」「一、」「(一)」「1、」「(1)」「甲、」，系統會處理半型全型的差異），方能處理。

Usage
-----

### CLI

```
$ commitment-parser <options> PDF檔名
```

範例與說明都寫在 `ppt-parser --help`。

### Library

```js
import pdftojson from 'pdftojson';
import parser from 'ppt-commitment-parser';

pdftojson(PDF路徑).then(pdfData => {
  var parsedData = parser(pdfData, parserOption);
  // parsedData 格式請見下「陣列輸出」
})
```


Output Format
-------------

### 輸入 PDF 範例

以[桃園市議會第 1 屆第 1 次定期會的市長施政報告](http://www.tycg.gov.tw/ch/home.jsp?id=20&parentpath=0,4&mcustomize=policy_list.jsp&qclass=201205290001)第 14 頁的某段文字為例：

![PDF](http://i.imgur.com/mX1pdHQ.png)

### CSV 輸出（CLI）

```csv
# 前 6 個固定是分層，第 7 個是頁碼，第 8、9 是左上點 x、y 坐標（pt），第 10 個是內文
# 坐標為最小的標題的坐標。
"政策規劃與執行","捷運城市","發展無縫公共運輸","推動捷運建設","","",14,80,454,"為配合//⋯⋯"
"政策規劃與執行","捷運城市","發展無縫公共運輸","推動捷運建設","航空城捷運線(綠線)","",14,109,556,"航空城捷運線(綠線)總長約//⋯⋯"
# ...
```

### Array 輸出（Library）

```js
[
  {
    number: 2,
    numberCH: '貳',
    text: '政策規劃與執行',
    page: 14,
    coord: [55, 373], // 左上點坐標，單位：pt
    items: [
      {
        number: 1,
        numberCH: '一',
        text: "捷運城市",
        page: 14,
        coord: [55, 402],
        items: [
          {
            number: 1,
            numberCH: '(一)',
            text: '發展無縫公共運輸',
            page: 14,
            coord: [62, 427],
            items: [
              {
                number: 1,
                numberCH: '1',
                text: '推動捷運建設',
                page: 14,
                coord: [80, 454],
                items: [
                  // text-only
                  {
                    text: '為配合航空城發展/* ⋯⋯ */及優質適居的低碳生態環境。',
                    page: 14,
                    coord: [132, 480]
                  },
                  { // text with number
                    number: 1,
                    numberCH: '(1)',
                    text: '航空城捷運線(綠線)',
                    page: 14,
                    coord: [109, 556]
                    items: [ /* ... */ ]
                  }, // ...
                ]
              }
            ]
          }, //...
        ]
      }, //...
    ]
  }, // ...
]
```

