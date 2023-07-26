var knex = require('lib/knex');
var q = require('q');

function deleteInvite(gameID, userID) {
	return knex('game_invites').del()
		.where({
			game_id: gameID,
			user_id: userID
		});
}

function updateInviteStatus(gameID, userID, status) {
	return knex('game_invites')
		.where({
			game_id: gameID,
			user_id: userID
		})
		.update('status', status);
}

module.exports = {
	deleteInvite: deleteInvite,
	updateInviteStatus: updateInviteStatus
};