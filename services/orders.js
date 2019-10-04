const moment = require('moment');
const logger = require('../logger');

const { groupBy } = require('./generalUtils');

/**
 * Get the formatted string for the percentage and number of orderers.
 * @param {Number} num the number of distinct users
 * @param {Number} total The total number of customers in that cohort
 * @returns {String} Returns a string "x% orders (total orders)"
 */
const getOrdersPercentString = (num, total) => `${((num / total) * 100).toFixed(0)}% orderers (${num})`;


/**
 * Get the formatted string for the percentage and number of first time orderers.
 * @param {Number} num the number of first time orderers
 * @param {Number} total The total number of customers in that cohort
 * * @returns {String} Returns a string "x% 1st time (first orders)"
 */
const getFirstTimePercentString = (num, total) => `${((num / total) * 100).toFixed(0)}% 1st time (${num})`;


/**
 * Get the time difference between when an order was placed, and the start of the cohort
 * @param {String} orderDate Date String formatted like YYYY-MM-DD, time optionally added on
 * @param {String} cohortWeek Date week string formatted like YYYY_ww where ww is the week number
 * @returns {String} String with time difference range: "beg - end days" ex: "14 - 20 days"
 */
const getTimeDiff = (orderDate, cohortWeek) => {
  const cohortStart = moment(cohortWeek, 'YYYY_ww').date('YYYY-MM-DD');

  const dayDiff = moment(orderDate).diff(cohortStart, 'days');

  if (dayDiff < 0) throw Error('A customer should not be able to order before they have joined');

  let dayDiffString;
  if (dayDiff <= 6) {
    dayDiffString = '0 - 6 days';
  } else if (dayDiff > 6 && dayDiff <= 13) {
    dayDiffString = '7 - 13 days';
  } else if (dayDiff > 13 && dayDiff <= 20) {
    dayDiffString = '14 - 20 days';
  } else if (dayDiff > 20 && dayDiff <= 27) {
    dayDiffString = '21 - 27 days';
  } else if (dayDiff > 27 && dayDiff <= 34) {
    dayDiffString = '28 - 34 days';
  } else if (dayDiff > 34 && dayDiff <= 41) {
    dayDiffString = '35 - 41 days';
  } else {
    dayDiffString = '42+ days';
  }

  return dayDiffString;
};


/**
 * Group cohort orders by the time from the start of the cohort
 * @param {Object} customerCohorts Object that has arrays of customers by the week that they joined
 * @returns {Object} Return object with new property orders, that has the time difference from
 * the start of the cohort as keys, and the orders that were made in that time difference as values
 * {
 *  '2015_28': {
 *    orders: {
 *      '0 - 6 days': [...orders...],
 *      '7 - 13 days': [....orders...],
 *       ....
 *       },
 *    customers: [...customers...],
 *    nCustomers: number of customers in cohort
 *  }
 * }
 */
const groupOrdersByTimeFromCustomerJoin = (customerCohorts) => Object.keys(customerCohorts)
  .reduce((allCohorts, cohortWeek) => {
    const { customers } = customerCohorts[cohortWeek];

    // array of all orders made by customers in this cohortWeek
    const ordersInCustCohort = customers.reduce((accum, customer) => {
      accum.push(...customer.orders.map((order) => order));
      return accum;
    }, []);

    // group those orders by the day difference from the cohort week
    const ordersWithTimeDiff = ordersInCustCohort.map((order) => ({
      orderTimeDiff: getTimeDiff(order.created, cohortWeek),
      ...order,
    }));

    // group ordersWithTimeDiff array by the orderTimeDiff property
    // eslint-disable-next-line no-param-reassign
    allCohorts[cohortWeek] = {
      orders: groupBy('orderTimeDiff')(ordersWithTimeDiff),
      ...customerCohorts[cohortWeek],

    };
    return allCohorts;
  }, {});


/**
 * Get the count of distinct users and new orders in each order time difference group.
 * @param {Object} cohortsWithOrderGroups Object that has arrays of customers by the week that they
 * joined, and order object that has each cohorts orders grouped by the time difference from the
 * start of the cohort
 * @returns {Object} object with new orders property that has the number of distinct users who
 * orders in that time frame, as well as the number of first time orders
 */
const getDistinctUserAndOrderCount = (cohortsWithOrderGroups) => Object.keys(cohortsWithOrderGroups)
  .reduce((customerCohorts, cohortWeek) => {
    const { orders: ordersOb, nCustomers } = cohortsWithOrderGroups[cohortWeek];

    const newOrders = Object.keys(ordersOb).reduce((newOrderOb, orderTimeDiff) => {
      const allOrders = ordersOb[orderTimeDiff];
      const userIds = allOrders.map((order) => order.user_id);
      const distinctUserCount = new Set(userIds).size;
      const firstOrderCount = allOrders.filter((order) => order.first_order).length;

      // eslint-disable-next-line no-param-reassign
      newOrderOb[orderTimeDiff] = {
        orders: allOrders,
        distinctUserCount: getOrdersPercentString(distinctUserCount, nCustomers),
        firstOrderCount: getFirstTimePercentString(firstOrderCount, nCustomers),
      };

      return newOrderOb;
    }, {});

    // eslint-disable-next-line no-param-reassign
    customerCohorts[cohortWeek] = {
      orders: newOrders,
      nCustomers: cohortsWithOrderGroups[cohortWeek].nCustomers,
      customers: cohortsWithOrderGroups[cohortWeek].customers,
    };

    return customerCohorts;
  }, {});


/**
 * From a given array of customers, get their array of orders, sort them by the created property,
 * and mark the first one as first_order = true in the orders table
 * @param {Array<Object>} customers an array of customer objects from the db
 * @returns {Object} Object with success property that is true when operation was successful,
 * else false
 */
const markFirstOrders = async (customers) => {
  await Promise.all(customers.map(({ orders }) => {
    if (orders.length) {
      orders.sort((a, b) => a.created - b.created);

      // sorted in descending order, so the first order made will be the first in the list
      if (!orders[0].first_order) return orders[0].update({ first_order: true });
      return ({});
    }
    return ({});
  }));
  return customers.map((customer) => customer.get({ plain: true }));
};

module.exports = {
  markFirstOrders,
  getDistinctUserAndOrderCount,
  groupOrdersByTimeFromCustomerJoin,
};
