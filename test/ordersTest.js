const { assert, expect } = require('chai');
const {
  getDistinctUserAndOrderCount,
  groupOrdersByTimeFromCustomerJoin,
} = require('../services/orders');

const getDistinctUserAndOrderCountInput = require('./mockData/getDistinctUserAndOrderCountInput.json');
const groupOrdersByTimeFromCustomerJoinInput = require('./mockData/groupOrdersByTimeFromCustomerJoinInput.json');


describe('Functional tests for orders services module: ', () => {
  describe('GetDistinctUserAndOrderCount function: ', () => {
    describe('Given an object of customer cohorts with the orders grouped by time difference: ', () => {
      const output = getDistinctUserAndOrderCount(getDistinctUserAndOrderCountInput);
      it('should return an object ', () => {
        assert.isTrue(output !== null && typeof output === 'object');
      });
      it('the object should have the properties distinctUserCount, firstOrderCount and orders', () => {
        // should always have at least 0-6 days key
        expect(output['2015_28'].orders['0 - 6 days']).to.have.keys(['distinctUserCount', 'firstOrderCount', 'orders']);
      });
    });
  });

  describe('GroupOrdersByTimeFromCustomerJoin function: ', () => {
    describe('Given a a customer cohort object: ', () => {
      const output = groupOrdersByTimeFromCustomerJoin(groupOrdersByTimeFromCustomerJoinInput);

      it('should return an object', () => {
        assert.isTrue(output !== null && typeof output === 'object');
      });
      it('each cohort week should have an orders property ', () => {
        Object.keys(output).forEach((cohortWeek) => {
          expect(output[cohortWeek]).to.have.keys(['orders', 'customers', 'nCustomers']);
        });
      });
      it('the orders property should also be an object', () => {
        Object.keys(output).forEach((cohortWeek) => {
          assert.isTrue(output[cohortWeek].orders !== null && typeof output[cohortWeek].orders === 'object');
        });
      });
    });
  });
});
