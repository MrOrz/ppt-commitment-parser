import {expect} from 'chai';
import parser from '../../src';

describe('parse', () => {
  it('should process PDF as described in README', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData);

    expect(parsedData).to.be.an('array');
  });

  it('start & end options should work', () => {
    const pdfData = require('../fixture/桃園1040417.json'),
          parsedData = parser(pdfData, {
            start: 10,
            end: 10
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
            footer: 724
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
            indent: 125
          });

    expect(parsedData).to.have.length(1);
    expect(parsedData[0].items[0].text.slice(0, 4)).to.equal('產業城市');

  });
});
