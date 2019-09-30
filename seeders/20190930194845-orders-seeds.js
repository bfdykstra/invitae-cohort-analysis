const csvParser = require('csv-parse/lib/sync');
const fs = require('fs');

const rawOrders = fs.readFileSync('./data/orders.csv');

const orders = csvParser(rawOrders, { columns: true });

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert('Orders', orders),

  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('Orders', null, {}),
};
