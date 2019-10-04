const moment = require('moment');
const db = require('../models');
const logger = require('../logger');

const { groupBy } = require('./generalUtils');


/**
 * Group the customers in to their respective cohorts from when they joined
 * @param {Array<Object>} customers array of customer records from db
 */
const splitCohorts = (customers) => {
  const customersArr = customers.map((customer) => ({
    joinedWeek: moment(customer.created).format('YYYY_ww'),
    orders: customer.orders.map((order) => order),
    ...customer,
  })); // flatten out the customers array object, give each object a createdWeek property
  return groupBy('joinedWeek')(customersArr);
};


/**
 * Count the number of customers in each cohort
 * @param {Object} customerCohorts Object that has arrays of customers by the week that they joined
 * @returns {Object} Object with week keys, and the property nCustomers that denotes how many
 * customers joined that week, and all the orders made by those customers
 */
const countCustomersByCohort = (customerCohorts) => Object.keys(customerCohorts)
  .reduce((accum, cohortWeek) => {
  // eslint-disable-next-line no-param-reassign
    accum[cohortWeek] = {
      nCustomers: customerCohorts[cohortWeek].length,
      customers: customerCohorts[cohortWeek],
    };
    return accum;
  }, {});


/**
 * Get customers who have at least 1 order, inner join between customers and orders,
 * order by created DESC
 * @param {Object} options object to pass to the findAll query
 * @returns { Array<Object>} Returns an array of only customers who have orders
 */
const getCustomersWithOrders = async (options) => {
  try {
    const allCusts = await db.customer.findAll({
      include: [{
        model: db.order,
        required: true,
      }],
      order: [['created', 'DESC']],
      ...options,
    });

    return allCusts;
  } catch (err) {
    logger.error('There was an error retrieving customers with orders: ', err);
    return ({
      error: err,
      message: `There was an error retrieving customers with orders: ${err.message}`,
    });
  }
};


module.exports = {
  getCustomersWithOrders,
  splitCohorts,
  countCustomersByCohort,
};
