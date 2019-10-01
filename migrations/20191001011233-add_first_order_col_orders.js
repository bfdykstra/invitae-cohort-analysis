
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'Orders',
    'first_order',
    {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  ),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn('Orders', 'first_order'),
};
