'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable('Posts', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER,
			},
			userId: {
				allowNull: false,
				type: Sequelize.INTEGER,
				references: {
					model: 'Users',
					id: 'id',
				},
				onDelete: 'CASCADE',
			},
			title: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			content: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			imgUrl: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			petName: {
				type: Sequelize.STRING,
			},
			category: {
				allowNull: false,
				type: Sequelize.STRING,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
			},
		});
	},
	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable('Posts');
	},
};
