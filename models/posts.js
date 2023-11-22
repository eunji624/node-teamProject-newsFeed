'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Posts extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			this.belongsTo(models.Users, {
				targetKey: 'userId',
				foreignKey: 'userId',
			});
		}
	}
	Posts.init(
		{
			postId: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			userId: {
				allowNull: false,
				type: DataTypes.INTEGER,
			},
			title: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			content: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			petName: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			category: {
				allowNull: false,
				type: DataTypes.STRING,
			},
		},
		{
			sequelize,
			modelName: 'Posts',
		},
	);
	return Posts;
};
