const db = require('../models');
const logger = require('../logger');

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
      group: [db.sequelize.fn('date_trunc', 'week', db.sequelize.col('order.created'))],
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

getGroupedOrders({ limit: 10 })
  .then(async (orders) => {
    // console.log('order length: ', orders.length);
    console.log(orders);
    // const res = await markFirstOrders(customers);
    // console.log('response: ', res);
  })
  .catch((e) => logger.error('error: ', e));
