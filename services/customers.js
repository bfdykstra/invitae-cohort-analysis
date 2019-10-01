const moment = require('moment');
const db = require('../models');
const logger = require('../logger');


/**
 * This function is from here: https://gist.github.com/JamieMason/0566f8412af9fe6a1d470aa1e089a752
 * @param {String} key key in which to groupby
 * @param {Array} array the array of objects that get grouped by the above key
 * @returns {Object} Return an object in which the keys are the given keys, and the values are
 * the objects in the given array that have that key value
 */
const groupBy = (key) => (array) => array.reduce((objectsByKeyValue, obj) => {
  const value = obj[key];
  // eslint-disable-next-line no-param-reassign
  objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
  return objectsByKeyValue;
}, {});

/**
 * Group the customers in to their respective cohorts from when they joined
 * @param {Array<Object>} customers array of customer records from db
 */
const getCustomerCohorts = (customers) => {
  const customersArr = customers.map((customer) => ({
    joinedWeek: moment(customer.created).format('YYYY_ww'),
    orders: customer.orders.map((order) => order.dataValues),
    ...customer.dataValues,
  })); // flatten out the customers array object, give each object a createdWeek property
  return groupBy('joinedWeek')(customersArr);
};

/**
 * Count the number of customers in each cohort
 * @param {Object} customerCohorts Object that has arrays of customers by the week that they joined
 * @returns {Object} Object with week keys, and the property n_customers that denotes how many
 * customers joined that week
 */
const countNumCustomersByCohort = (customerCohorts) => Object.keys(customerCohorts)
  .reduce((accum, cohortWeek) => {
  // eslint-disable-next-line no-param-reassign
    accum[cohortWeek] = { n_customers: customerCohorts[cohortWeek].length };
    return accum;
  }, {});

/**
 * Get customers who have at least 1 order, this is an inner join between customers and orders
 * @param {Object} an options object to pass to the findAll query
 * @returns { Array<Object>} Returns an array of only customers who have orders
 */
const getCustomersWithOrders = async (options) => {
  try {
    return db.customer.findAll({
      include: [{
        model: db.order,
        required: true,
      }],
      ...options,
    });
  } catch (err) {
    // log out error:
    logger.error('there was an error retrieving customers with orders: ', err);
    return ({
      error: err,
      message: 'there was an error retrieving customers with orders',
    });
  }
};


/**
 * TODO: make the structure of this error handling/ return graceful
 * From a given array of customers, get their array of orders, sort them by the created property,
 * and mark the first one as first_order = true in the orders table
 * @param {Array<Object>} customers an array of customer objects from the db
 */
const markFirstOrders = async (customers) => {
  try {
    for (let i = 0; i < customers.length; i += 1) {
      const { orders } = customers[i];
      if (orders.length) {
        orders.sort((a, b) => a.created - b.created);

        // sorted in descending order, so the first order made will be the first in the list
        if (!orders[0].first_order) orders[0].update({ first_order: true });
      }
    }
    return ({ success: true });
  } catch (error) {
    logger.error(error);
    return ({ success: false });
  }
};

getCustomersWithOrders({ limit: 100 })
  .then((customers) => {
    const grouped = getCustomerCohorts(customers);
    logger.debug('grouped up: ', grouped);
    // const nCust = countNumCustomersByCohort(grouped);

    // logger.debug(nCust);
  })
  .catch((e) => logger.error(e));

module.exports = {
  getCustomersWithOrders,
  markFirstOrders,
  getCustomerCohorts,
  countNumCustomersByCohort,
};
