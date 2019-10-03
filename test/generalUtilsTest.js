const { assert, expect } = require('chai');
const groupByMockData = require('./mockData/groupByMock.json');
const formatCSVInput = require('./mockData/formatCSVInput.json');
const {
  formatForCSV,
  groupBy,
  formatCohortDate,
} = require('../services/generalUtils');

describe('Functional tests for the generalUtils modules: ', () => {
  describe('GroupBy function: ', () => {
    const groupByBrand = groupBy('brand')(groupByMockData);
    describe('Given a field to groupBy and an array of objects', () => {
      it('should return an object', () => {
        assert.isTrue(groupByBrand !== null && typeof groupByBrand === 'object');
      });
      it('should return an object whose keys are the distinct values of the given field', () => {
        expect(Object.keys(groupByBrand)).to.eql(['Audi', 'Ferarri', 'Ford', 'Peugot']);
      });
      it('the values of the keys should be arrays', () => {
        Object.keys(groupByBrand).forEach((brand) => {
          assert.isArray(groupByBrand[brand]);
        });
      });
    });
  });

  describe('FormatCohortDate function: ', () => {
    const cohortDateRange = formatCohortDate('2015_27');
    it('should return a string', () => {
      assert.isString(cohortDateRange);
    });
    it('should return a string formatted like M/DD - M/DD', () => {
      const [beg, end] = cohortDateRange.split('-');
      const [begMonth, begDay] = beg.trim().split('/');
      const [endMonth, endDay] = end.trim().split('/');
      assert.ok(begMonth);
      assert.ok(begDay);
      assert.ok(endMonth);
      assert.ok(endDay);
    });
  });

  describe('FormatForCSV function: ', () => {
    const rows = formatForCSV(formatCSVInput, Object.keys(formatCSVInput),
      ['0 - 6 days', '7 - 13 days', '14 - 20 days', '21 - 27 days', '28 - 34 days', '35 - 41 days', '42+ days']);

    it('should return an array of objects', () => {
      assert.isArray(rows);
      assert.isTrue(rows[0] !== null && typeof rows[0] === 'object');
    });
    it('each object in the array should have the proper column fields', () => {
      expect(rows[0]).to.have.keys(['Cohort', 'Customers', '0 - 6 days', '7 - 13 days', '14 - 20 days', '21 - 27 days', '28 - 34 days', '35 - 41 days', '42+ days']);
    });
  });
});
