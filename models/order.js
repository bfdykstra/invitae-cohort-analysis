
module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('order', {
    order_number: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,
    created: DataTypes.DATE,
  }, {
    timestamps: false,
    tableName: 'Orders',
  });

  Order.associate = function associate(models) {
    const { customer, order } = models;
    order.belongsTo(customer, {
      foreignKey: 'user_id',
    });
  };
  return Order;
};
