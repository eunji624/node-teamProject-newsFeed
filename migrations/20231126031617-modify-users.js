'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		/**
		 * Add altering commands here.
		 *
		 * Example:
		 * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
		 */
		await queryInterface.addColumn('Users', 'sesId', {
			type: Sequelize.STRING,
		});

		await queryInterface.addColumn('Users', 'provider', {
			type: Sequelize.STRING,
		});
	},

	async down(queryInterface, Sequelize) {
		/**
		 * Add reverting commands here.
		 *
		 * Example:
		 * await queryInterface.dropTable('users');
		 */
		await queryInterface.removeColumn('Users', 'sesId', {
			type: Sequelize.STRING,
		});
		await queryInterface.removeColumn('Users', 'provider', {
			type: Sequelize.STRING,
		});
	},
};
