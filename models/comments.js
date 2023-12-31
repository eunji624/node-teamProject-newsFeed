'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
	class Comments extends Model {
		static associate(models) {
			this.belongsTo(models.Users, {
				targetKey: 'id',
				foreignKey: 'userId',
				onDelete: 'CASCADE',
			});
			this.belongsTo(models.Posts, {
				targetKey: 'id',
				foreignKey: 'postId',
				onDelete: 'CASCADE',
			});
		}
	}
	Comments.init(
		{
			commentId: {
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
			postId: {
				allowNull: false,
				type: DataTypes.INTEGER,
				onDelete: 'CASCADE',
			},
			content: {
				allowNull: false,
				type: DataTypes.STRING,
			},
		},
		{
			sequelize,
			modelName: 'Comments',
		},
	);
	return Comments;
};
