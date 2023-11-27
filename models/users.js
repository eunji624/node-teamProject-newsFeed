'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Users extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			this.hasMany(models.Posts, {
				sourceKey: 'id',
				foreignKey: 'userId',
			});
			this.hasMany(models.Comments, {
				sourceKey: 'id',
				foreignKey: 'userId',
			});
		}
	}
	Users.init(
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			name: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			email: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			sesId: {
				type: DataTypes.STRING,
			},
			provider: {
				type: DataTypes.STRING,
			},
			password: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			description: {
				type: DataTypes.STRING,
			},
		},
		{
			sequelize,
			modelName: 'Users',
		},
	);
	return Users;
};
