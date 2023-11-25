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
				targetKey: 'id',
				foreignKey: 'userId',
				onDelete: 'CASCADE',
			});
			this.hasMany(models.Comments, {
				sourceKey: 'id',
				foreignKey: 'postId',
			});
		}
	}
	Posts.init(
		{
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: DataTypes.INTEGER,
			},
			userId: {
				allowNull: false,
				type: DataTypes.INTEGER,
				onDelete: 'CASCADE',
			},
			title: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			content: {
				allowNull: false,
				type: DataTypes.STRING,
			},
			imgUrl: {
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
