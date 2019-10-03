const { assert, expect } = require('chai');

const {
  splitCohorts,
  countCustomersByCohort,
} = require('../services/customers');
const customerMock = require('./mockData/customerMock.json');
const countCustomerByCohortInput = require('./mockData/countCustomerByCohortInput.json');


describe('Functional tests for customers module: ', () => {
  describe('SplitCohorts function: ', () => {
    describe('Given an array of customer records from the database: ', () => {
      const splitUp = splitCohorts(customerMock);
      it('Should return an object', () => {
        assert.isTrue(splitUp !== null && typeof splitUp === 'object');
      });
      it('The returned object should have cohort week keys, with values that are arrays of customers in that cohort', () => {
        Object.keys(splitUp).forEach((cohortWeek) => {
          assert.isArray(splitUp[cohortWeek]);
        });
      });
    });
  });

  describe('CountCustomersByCohort function: ', () => {
    describe('Given a customer cohorts object: ', () => {
      const customersWithCounts = countCustomersByCohort(countCustomerByCohortInput);
      it('Should return an object', () => {
        assert.isTrue(customersWithCounts !== null && typeof customersWithCounts === 'object');
      });
      it('For each customer cohort object, it should have an nCustomers property with an integer value', () => {
        Object.keys(customersWithCounts).forEach((cohortWeek) => {
          expect(customersWithCounts[cohortWeek]).to.have.keys(['nCustomers', 'customers']);
        });
      });
    });
  });
});
