const csvParser = require('csv-parse/lib/sync');
const fs = require('fs');

const rawCustomers = fs.readFileSync('./data/customers.csv');

const customers = csvParser(rawCustomers, { columns: true });

module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.bulkInsert('Customers', customers),
  down: (queryInterface, Sequelize) => queryInterface.bulkDelete('Customers', null, {}),
};
