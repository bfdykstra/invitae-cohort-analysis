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
 * Retrieve every order with its customer attribute, inner join
 * @param {Object} options options object to pass to sequelize query
 */
const getOrdersWithCustomers = async (options) => {
  try {
    return db.order.findAll({
      include: [{
        model: db.customer,
        required: true,
      }],
      ...options,
    });
  } catch (err) {
    // log out error:
    logger.error('there was an error retrieving orders with customers: ', err);
    return ({
      error: err,
      message: 'there was an error retrieving orders with customers',
    });
  }
};

/**
 * Get orders grouped by the week that they were made
 * @param {Object} options object of custom options to pass to sequelize query
 */
const getGroupedOrders = async (options) => {
  try {
    return db.order.findAll({
      include: [{
        model: db.customer,
        required: true,
      }],
      ...options,
    });
  } catch (err) {
    logger.error('error grouping orders: ', err);

    return ({
      error: err,
      message: 'there was an error groupin stuff',
    });
  }
};

/**
 * Group an array of orders by the week they were made. Keys are the YYYY_ww
 * where ww in [1, 53], https://momentjs.com/docs/#/parsing/string-format/
 * @param {Array<Object>} orders array of order database records
 * @returns {Object}
 */
const groupOrdersByWeek = (orders) => {
  const ordersArr = orders.map((order) => ({
    createdWeek: moment(order.created).format('YYYY_ww'),
    customer: { ...order.customer.dataValues },
    ...order.dataValues,
  })); // flatten out the orders array object, give each object a createdWeek property

  return groupBy('createdWeek')(ordersArr);
};


getGroupedOrders({ limit: 50 })
  .then((orders) => {
    // console.log('order length: ', orders.length);

    const groupedOb = groupOrdersByWeek(orders);
    console.log(groupedOb);
    // const res = await markFirstOrders(customers);
    // console.log('response: ', res);
  })
  .catch((e) => logger.error('error: ', e));
