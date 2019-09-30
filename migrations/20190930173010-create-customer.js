
module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Customers', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    created: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: (queryInterface, Sequelize) => queryInterface.dropTable('Customers'),
};
