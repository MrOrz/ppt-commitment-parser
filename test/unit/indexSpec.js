import {expect} from 'chai';
import parser from '../../src';

describe('parse', () => {
  it('should process PDF as described in README', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {quiet: true});

    expect(parsedData).to.be.an('array');
  });

  it('start & end options should work', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {
            start: 10,
            end: 10,
            quiet: true
          });

    expect(parsedData, 'parsedData').to.have.length(1);
    //                壹       一、
    expect(parsedData[0].items[0].items, 'parsedData.items[0].items[0].items').to.have.length(7);
    expect(parsedData[0].items[1].text.slice(0, 4)).to.equal('產業城市');
  });

  it('header & footer options should work', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {
            start: 10,
            end: 10,

            /* after 產業城市, but before 加速招商 */
            header: 536,
            footer: 724,

            quiet: true
          });

    //                壹       八、
    expect(parsedData[0].items[0].text.slice(0, 4)).to.equal('產業城市');
    expect(parsedData[0].items[0].items[0].items).to.have.length(2);

  });

  it('indent option should work', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {
            start: 10,
            end: 10,

            /* Only 八、產業城市 can emerge from this indent */
            indent: 125,
            quiet: true
          });

    expect(parsedData).to.have.length(1);
    expect(parsedData[0].items[0].text.slice(0, 4)).to.equal('產業城市');

  });

  it('center option should work', () => {
    const pdfData = require('../fixture/taipei-culture.json'),
          parsedData = parser(pdfData, {
            indent: 77, // Only (一) can emerge from this indent
            footer: 764,
            center: true,
            quiet: true
          });

    expect(parsedData).to.have.length(1);
    expect(parsedData[0].numberCH).to.equal('肆');
    expect(parsedData[0].text).to.equal('文 化');

    // 一、重要施政成果；二、創新作為；三、未來重點
    expect(parsedData[0].items, 'parsedData[0].items').to.have.length(3);
    expect(parsedData[0].items[0].text).to.equal('103 年度下半年重要施政成果');

    // (一)～(五)
    expect(parsedData[0].items[0].items, 'parsedData[0].items[0].items').to.have.length(5);
  })

  it('should invert Y coordinate of each bounding box', () => {
    // PDF.js uses bottom-left corner as (0,0), thus inverting the Y-coord here.

    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {quiet: true});

    expect(parsedData[0].coord[1]).to.equal(842 - 98.279297);
  });
});
