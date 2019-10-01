const db = require('../models');
const logger = require('../logger');

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
        orders[0].update({ first_order: true });
      }
    }
    return ({ success: true });
  } catch (error) {
    logger.error(error);
    return ({ success: false });
  }
};

getOrdersWithCustomers({ limit: 10 })
  .then(async (orders) => {
    console.log('order length: ', orders.length);
    console.log(orders);
    // const res = await markFirstOrders(customers);
    // console.log('response: ', res);
  })
  .catch((e) => logger.error('error: ', e));
module.exports = {
  getCustomersWithOrders,
  markFirstOrders,

};
