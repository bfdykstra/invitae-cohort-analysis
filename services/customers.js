const moment = require('moment');
const db = require('../models');
const logger = require('../logger');


/**
 * This function is from here: https://gist.github.com/JamieMason/0566f8412af9fe6a1d470aa1e089a752.
 * Using this, because it's much easier than trying to use Sequelize with groups and aggregate
 * functions
 * @param {String} key key in which to groupby
 * @param {Array} array the array of objects that get grouped by the above key
 * @returns {Object} An object in which the keys are the distinct values of the
 * given groupby key, and the values are the objects in the given array that
 * have that key value
 */
const groupBy = (key) => (array) => array.reduce((objectsByKeyValue, obj) => {
  const value = obj[key];
  // eslint-disable-next-line no-param-reassign
  objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
  return objectsByKeyValue;
}, {});


/**
 * Get the formatted string for the percentage and number of first time orderers.
 * @param {Number} num the number of first time orderers
 * @param {Number} total The total number of customers in that cohort
 */
const getFirstTimePercentString = (num, total) => `${((num / total) * 100).toFixed(0)}% 1st time (${num})`;


/**
 * Get the formatted string for the percentage and number of orderers.
 * @param {Number} num the number of distinct users
 * @param {Number} total The total number of customers in that cohort
 */
const getOrdersPercentString = (num, total) => `${((num / total) * 100).toFixed(0)}% orderers (${num})`;

/**
 * Format a given year and week string so that it returns a string of the start
 * date of the week, and the end date of the week
 * @param {String} cohortWeek Cohort week string, formatted like YYYY_ww
 * @returns {String} Start of the week - End of the week, formatted like M/DD - M/DD
 */
const formatCohortDate = (cohortWeek) => `${moment(cohortWeek, 'YYYY_ww').startOf('week').format('M/DD')} - ${moment(cohortWeek, 'YYYY_ww').endOf('week').format('M/DD')}`;
/**
 *
 * @param {String} orderDate Date String formatted like YYYY-MM-DD, time optionally added on
 * @param {String} cohortWeek Date week string formatted like YYYY_ww where ww is the week number
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
 * Group the customers in to their respective cohorts from when they joined
 * @param {Array<Object>} customers array of customer records from db
 */
const splitCohorts = (customers) => {
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
 * @returns {Object} Object with week keys, and the property nCustomers that denotes how many
 * customers joined that week, and all the orders made by those customers
 */
const countNumCustomersByCohort = (customerCohorts) => Object.keys(customerCohorts)
  .reduce((accum, cohortWeek) => {
  // eslint-disable-next-line no-param-reassign
    accum[cohortWeek] = {
      nCustomers: customerCohorts[cohortWeek].length,
      customers: customerCohorts[cohortWeek],
    };
    return accum;
  }, {});


/**
 *
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
      accum.push(...customer.orders.map((order) => order.dataValues));
      return accum;
    }, []);

    // group those orders by the day difference from the cohort week
    const ordersWithTimeDiff = ordersInCustCohort.map((order) => ({
      orderTimeDiff: getTimeDiff(order.created, cohortWeek),
      ...order,
    }));

    // eslint-disable-next-line no-param-reassign
    allCohorts[cohortWeek] = {
      orders: groupBy('orderTimeDiff')(ordersWithTimeDiff), // group ordersWithTimeDiff array by the orderTimeDiff property
      ...customerCohorts[cohortWeek],

    };
    return allCohorts;
  }, {});


/**
 * Get the count of distinct users and new orders in each order time difference group.
 * TODO: this function name is trash, and doing two things, maybe split up
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
 * Get customers who have at least 1 order, inner join between customers and orders
 * @param {Object} options object to pass to the findAll query
 * @returns { Array<Object>} Returns an array of only customers who have orders
 */
const getCustomersWithOrders = async (options) => {
  try {
    return db.customer.findAll({
      include: [{
        model: db.order,
        required: true,
      }],
      order: [['created', 'DESC']],
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
 * @returns {Object} Object with success property that is true when operation was successful,
 * else false
 */
const markFirstOrders = async (customers) => {
  try {
    // for (let i = 0; i < customers.length; i += 1) {
    //   const { orders } = customers[i];
    //   if (orders.length) {
    //     orders.sort((a, b) => a.created - b.created);

    //     // sorted in descending order, so the first order made will be the first in the list
    //     if (!orders[0].first_order) await orders[0].update({ first_order: true });
    //     // logger.debug('orders: ', orders);
    //   }
    // }

    await Promise.all(customers.map(({ orders }) => {
      if (orders.length) {
        orders.sort((a, b) => a.created - b.created);

        // sorted in descending order, so the first order made will be the first in the list
        if (!orders[0].first_order) return orders[0].update({ first_order: true });

        // logger.debug('orders: ', orders);
      }
    }));
    return ({ success: true });
  } catch (error) {
    logger.error(error);
    return ({ success: false });
  }
};


/**
 *
 * @param {Object} allCohorts Object that has arrays of customers by the week that they
 * joined, and order object that has each cohorts orders grouped by the time difference from the
 * start of the cohort
 * @param {Array<String>} cohortWeekArr A sorted array of all of the cohort weeks
 * @param {Array<String>} orderTimeDiffArr An array of all the time difference strings for orders
 */
const formatForCSV = (allCohorts, cohortWeekArr, orderTimeDiffArr) => cohortWeekArr.map(
  (cohortWeek) => {
    const rowOb = {
      Cohort: formatCohortDate(cohortWeek),
      Customers: allCohorts[cohortWeek] ? `${allCohorts[cohortWeek].nCustomers} Customers` : '',
    };

    // get each time diff in as a column
    orderTimeDiffArr.forEach((timeDiff) => {
      rowOb[timeDiff] = allCohorts[cohortWeek] && allCohorts[cohortWeek].orders[timeDiff]
        ? `${allCohorts[cohortWeek].orders[timeDiff].distinctUserCount}, ${allCohorts[cohortWeek].orders[timeDiff].firstOrderCount}`
        : '';
    });

    return rowOb;
  },
);


getCustomersWithOrders()
  .then(async (customers) => {
    await markFirstOrders(customers);

    // logger.debug(customers.map((cust) => cust.orders.map((order) => order.dataValues)));
    const grouped = splitCohorts(customers);

    const nCust = countNumCustomersByCohort(grouped);

    const cohortsWithOrderGroups = groupOrdersByTimeFromCustomerJoin(nCust);

    // get count of distinct user ids for each order group
    const distinctCounts = getDistinctUserAndOrderCount(cohortsWithOrderGroups);
    // logger.debug(JSON.stringify(distinctCounts));

    const rows = formatForCSV(distinctCounts, Object.keys(distinctCounts),
      ['0 - 6 days', '7 - 13 days', '14 - 20 days', '21 - 27 days', '28 - 34 days', '35 - 41 days', '42+ days']);

    logger.debug('rows: ', rows);
  })
  .catch((e) => logger.error(e));

module.exports = {
  getCustomersWithOrders,
  markFirstOrders,
  splitCohorts,
  countNumCustomersByCohort,
};
