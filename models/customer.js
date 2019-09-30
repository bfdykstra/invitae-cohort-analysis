
module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('customer', {
    id: {
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    created: DataTypes.DATE,
  }, {
    timestamps: false,
    tableName: 'Customers',
  });
  Customer.associate = function associate(models) {
    const { customer, order } = models;
    customer.hasMany(order, {
      foreignKey: 'user_id',
      sourceKey: 'id',

    });
  };
  return Customer;
};
