var authentication = require('controllers/authentication-controller');
var registration = require('controllers/registration-controller');
var settings = require('controllers/settings-controller');
var location = require('controllers/change-location-controller');
var searchPlayers = require('controllers/search-player-controller');
var rateUser = require('controllers/rate-user-controller');
var getProfileController = require('controllers/get-profile-controller');
var getRegionalRankingsController = require('controllers/get-regional-rankings-controller');
var userController = require('controllers/user-controller');
var createGameController = require('controllers/create-game-controller');
var searchGameController = require('controllers/search-game-controller');
var inviteToGameController = require('controllers/invite-to-game-controller');
var applyForGameController = require('controllers/apply-for-game-controller');
var getGameApplicationsController = require('controllers/get-game-applications-controller');
var respondToGameInviteController = require('controllers/respond-to-game-invite-controller');
var getGameInvitesReceivedController = require('controllers/get-game-invites-received-controller');
var getInvitedToGameController = require('controllers/get-invited-to-game-controller');
var respondToGameApplicationController = require('controllers/respond-to-game-application-controller');
var getOwnedGamesController = require('controllers/get-owned-games-controller');
var getJoinedGamesController = require('controllers/get-joined-games-controller');
var getAssociatedGamesController = require('controllers/get-associated-games-controller');
var getGameInfoController = require('controllers/get-game-info-controller');
var getGameAcceptedPlayersController = require('controllers/get-game-accepted-players-controller');
var leaveGameController = require('controllers/leave-game-controller');
var teamController = require('controllers/team-controller');
var notificationsController = require('controllers/notifications-controller');
var getRatingController = require('controllers/get-rating-controller');
var chatController = require('controllers/chat-controller');
var postController = require('controllers/post-controller');
var searchController = require('controllers/search-controller');
var rateTeamController = require('controllers/rate-team-controller');
var createTeamGameController = require('controllers/create-team-game-controller');
var getUnpublishedGameController = require('controllers/get-unpublished-game-controller');
var updateGameController = require('controllers/update-game-controller');
var getTeamTrainingController = require('controllers/get-team-training-controller');
var getTeamUpcomingGamesController = require('controllers/get-team-upcoming-games-controller');
var getTeamRegionalRankingsController = require('controllers/get-team-regional-rankings-controller');
var joinTeamController = require('controllers/join-team-controller');
var getTeamFinancesController = require('controllers/get-team-finances-controller');
var updateTeamFinancesController = require('controllers/update-team-finances-controller');
var blockUserController = require('controllers/block-user-controller');
var createTeamTrainingController = require('controllers/create-team-training-controller');
var getTeamGameInvitesController = require('controllers/get-team-game-invites-controller');
var sandboxController = require('controllers/sandbox-controller');

// Articles
var getArticleController = require('controllers/article/get-article-controller');
var getRecentArticlesController = require('controllers/article/get-recent-articles-controller');
var getVendorArticlesController = require('controllers/article/get-vendor-articles-controller');
var getVendorController = require('controllers/article/get-vendor-controller');
var getVendorsController = require('controllers/article/get-vendors-controller');
// Articles (admin)
var createArticleController = require('controllers/article/admin/create-article-controller');
var createVendorController = require('controllers/article/admin/create-vendor-controller');
var editArticleController = require('controllers/article/admin/edit-article-controller');
var editVendorController = require('controllers/article/admin/edit-vendor-controller');
var deleteArticleController = require('controllers/article/admin/delete-article-controller');
var deleteVendorController = require('controllers/article/admin/delete-vendor-controller');

var adminLoginController = require('controllers/admin-login-controller');
var adminCheckTokenController = require('controllers/admin-check-token-controller');

// Duties
var createTeamDutyController = require('controllers/create-team-duty-controller');
var assignTeamDutyController = require('controllers/assign-duty-controller');
var removeTeamMemberDutyController = require('controllers/remove-team-member-duty-controller');
var getTeamDutiesController = require('controllers/get-team-duties-controller');
var removeTeamDutyController = require('controllers/remove-duty-controller');

// Send email
var resetPasswordController = require('controllers/reset-password-controller');

module.exports = function(router) {

    if(typeof router === 'undefined') {
      router = null;
    }

    var routes = [
      {command:  0, httpmethod: 'post', uri: '/login', controller: authentication, method: 'login', secure: false, },
      {command: 10, httpmethod: 'post', uri: '/register', controller: registration, method: 'register', secure: false, },
      {command: 20, httpmethod: 'post', uri: '/location', controller: location, method: 'changeLocation', secure: true, },
      {command: 30, httpmethod: 'post', uri: '/settings', controller: settings, method: 'changeSettings', secure: true, },
      {command: 35, httpmethod: 'post', uri: '/get-settings', controller: settings, method: 'getSettings', secure: true, },
      {command: 40, httpmethod: 'post', uri: '/get-profile', controller: getProfileController, method: 'getProfile', secure: true, },
      {command: 45, httpmethod: 'post', uri: '/get-regional-rankings', controller: getRegionalRankingsController, method: 'getRankings', secure: true, },
      {command: 50, httpmethod: 'post', uri: '/get-user-data', controller: userController, method: 'getUserData', secure: true, },
      {command: 60, httpmethod: 'post', uri: '/update-user-data', controller: userController, method: 'updateData', secure: true, },
      {command: 70, httpmethod: 'post', uri: '/search-players-by-distance', controller: searchPlayers, method: 'searchByDistance', secure: true, },
      {command: 75, httpmethod: 'post', uri: '/search-players-by-name', controller: searchPlayers, method: 'searchByName', secure: true, },
      {command: 80, httpmethod: 'post', uri: '/rate-user', controller: rateUser, method: 'rateUser', secure: true, },
      {command: 90, httpmethod: 'post', uri: '/get-user-rating', controller: getRatingController, method: 'getRating', secure: true, },
      {command: 100, httpmethod: 'post', uri: '/user-birthday', controller: userController, method: 'changeBirthday', secure: true, },
      {command: 110, httpmethod: 'post', uri: '/user-gcmid', controller: userController, method: 'addGCMID', secure: true, },
      // {command: 120, endpoint: '', controller: GetVenuesReques, method: '', secure: true, },
      {command: 130, httpmethod: 'post', uri: '/create-game', controller: createGameController, method: 'createGame', secure: true, },
      {command: 140, httpmethod: 'post', uri: '/search-games', controller: searchGameController, method: 'searchGames', secure: true, },
      {command: 150, httpmethod: 'post', uri: '/invite-to-game', controller: inviteToGameController, method: 'inviteToGame', secure: true, },
      {command: 160, httpmethod: 'post', uri: '/apply-for-game', controller: applyForGameController, method: 'applyForGame', secure: true, },
      {command: 170, httpmethod: 'post', uri: '/get-game-applications', controller: getGameApplicationsController, method: 'getGameApplications', secure: true, },
      {command: 180, httpmethod: 'post', uri: '/respond-to-game-invite', controller: respondToGameInviteController, method: 'respondToGameInvite', secure: true, },
      {command: 190, httpmethod: 'post', uri: '/get-game-invites', controller: getGameInvitesReceivedController, method: 'getGameInvitesReceived', secure: true, },
      {command: 200, httpmethod: 'post', uri: '/get-invited-to-game', controller: getInvitedToGameController, method: 'getInvitedToGame', secure: true, },
      {command: 210, httpmethod: 'post', uri: '/respond-to-game-application', controller: respondToGameApplicationController, method: 'respondToGameApplication', secure: true, },
      {command: 220, httpmethod: 'post', uri: '/get-owned-games', controller: getOwnedGamesController, method: 'getOwnedGames', secure: true, },
      {command: 225, httpmethod: 'post', uri: '/get-joined-games', controller: getJoinedGamesController, method: 'getJoinedGames', secure: true, },
      {command: 226, httpmethod: 'post', uri: '/get-associated-games', controller: getAssociatedGamesController, method: 'getAssociatedGames', secure: true, },
      {command: 230, httpmethod: 'post', uri: '/get-game-info', controller: getGameInfoController, method: 'getGameInfo', secure: true, },
      {command: 235, httpmethod: 'post', uri: '/get-game-accepted-players', controller: getGameAcceptedPlayersController, method: 'getGameAcceptedPlayers', secure: true, },
      {command: 240, httpmethod: 'post', uri: '/leave-game', controller: leaveGameController, method: 'leaveGame', secure: true, },
      {command: 245, httpmethod: 'post', uri: '/create-team-game', controller: createTeamGameController, method: 'createTeamGame', secure: true, },
      {command: 250, httpmethod: 'post', uri: '/get-unpublished-game', controller: getUnpublishedGameController, method: 'getUnpublishedGame', secure: true, },
      {command: 255, httpmethod: 'post', uri: '/update-game', controller: updateGameController, method: 'updateGame', secure: true, },
      {command: 260, httpmethod: 'post', uri: '/get-team-training', controller: getTeamTrainingController, method: 'getTeamTraining', secure: true, },
      {command: 265, httpmethod: 'post', uri: '/get-team-upcoming-games', controller: getTeamUpcomingGamesController, method: 'getTeamUpcomingGames', secure: true, },
      {command: 270, httpmethod: 'post', uri: '/create-team-training', controller: createTeamTrainingController, method: 'createTeamTraining', secure: true, },
      {command: 280, httpmethod: 'post', uri: '/get-team-game-invites', controller: getTeamGameInvitesController, method: 'getTeamGameInvites', secure: true, },

      {command: 290, httpmethod: 'post', uri: '/create-team-duty', controller: createTeamDutyController, method: 'createTeamDuty', secure: true, },
      {command: 300, httpmethod: 'post', uri: '/assign-team-duty', controller: assignTeamDutyController, method: 'assignDuty', secure: true, },
      {command: 310, httpmethod: 'post', uri: '/remove-team-member-duty', controller: removeTeamMemberDutyController, method: 'removeTeamMemberDuty', secure: true, },
      {command: 320, httpmethod: 'post', uri: '/get-team-duties', controller: getTeamDutiesController, method: 'getTeamDuties', secure: true, },
      {command: 330, httpmethod: 'post', uri: '/remove-team-duty', controller: removeTeamDutyController, method: 'removeDuty', secure: true, },
      // {command: 300, endpoint: '', controller: GetConversationIDReques, method: '', secure: true, },
      // {command: 310, endpoint: '', controller: SendMessageReques, method: '', secure: true, },
      // {command: 320, endpoint: '', controller: GetMessagesReques, method: '', secure: true, },
      // {command: 330, endpoint: '', controller: SeenMessageReques, method: '', secure: true, },
      // {command: 340, endpoint: '', controller: GetSeenDictionaryReques, method: '', secure: true, },
      // {command: 350, endpoint: '', controller: SetWritingStatusReques, method: '', secure: true, },
      // {command: 360, endpoint: '', controller: SubscribeToConversationReques, method: '', secure: true, },
      // {command: 370, endpoint: '', controller: GetConversationsReques, method: '', secure: true, },
      // {command: 380, endpoint: '', controller: CreateGroupChatReques, method: '', secure: true, },
      // {command: 390, endpoint: '', controller: LeaveConversationReques, method: '', secure: true, },
      // {command: 400, endpoint: '', controller: KickFromConversationReques, method: '', secure: true, },
      // {command: 405, endpoint: '', controller: GetInConversationReques, method: '', secure: true, },
      // {command: 410, endpoint: '', controller: GetOwnersOfConversationReques, method: '', secure: true, },
      // {command: 420, endpoint: '', controller: GetConversationUsersReques, method: '', secure: true, },
      // {command: 430, endpoint: '', controller: InviteToConversationReques, method: '', secure: true, },
      // {command: 440, endpoint: '', controller: PromoteConversationUserReques, method: '', secure: true, },
      // {command: 600, endpoint: '', controller: GetUnreadNotificationsReques, method: '', secure: true, },
      {command: 605, httpmethod: 'post', uri: '/notifications/get-all', controller: notificationsController, method: 'getAll', secure: true, },
      {command: 615, httpmethod: 'post', uri: '/update-notification', controller: notificationsController, method: 'updateNotification', secure: true, },
      {command: 620, httpmethod: 'post', uri: '/bulk-update-notifications', controller: notificationsController, method: 'bulkUpdateNotification', secure: true, },
      {command: 1000, httpmethod: 'post', uri: '/teams/create', controller: teamController, method: 'createTeam', secure: true, },
      {command: 1010, httpmethod: 'post', uri: '/get-own-teams', controller: teamController, method: 'getOwnedTeams', secure: true, },
      {command: 1015, httpmethod: 'post', uri: '/get-teams', controller: teamController, method: 'getTeams', secure: true, },
      {command: 1017, httpmethod: 'post', uri: '/get-associated-teams', controller: teamController, method: 'getAssociatedTeams', secure: true, },
      {command: 1020, httpmethod: 'post', uri: '/invite-to-team', controller: teamController, method: 'inviteToTeam', secure: true, },
      {command: 1030, httpmethod: 'post', uri: '/respond-to-team-invite', controller: teamController, method: 'respondToTeamInvite', secure: true, },
      {command: 1040, httpmethod: 'post', uri: '/remove-from-team', controller: teamController, method: 'removeFromTeam', secure: true, },
      {command: 1050, httpmethod: 'post', uri: '/get-team-playesr', controller: teamController, method: 'getTeamPlayers', secure: true, },
      {command: 1055, httpmethod: 'post', uri: '/get-confirmed-team-players', controller: teamController, method: 'getUnconfirmedTeamPlayers', secure: true, },
      {command: 1060, httpmethod: 'post', uri: '/change-team-player-positions', controller: teamController, method: 'changeTeamPlayerPositions', secure: true, },
      // {command: 1070, endpoint: '', controller: GetTeamChatIDReques, method: '', secure: true, },
      {command: 1080, httpmethod: 'post', uri: '/change-team-name', controller: teamController, method: 'changeTeamName', secure: true, },
      {command: 1090, httpmethod: 'post', uri: '/get-team', controller: teamController, method: 'getTeam', secure: true, },
      {command: 1092, httpmethod: 'post', uri: '/get-team-finances', controller: getTeamFinancesController, method: 'getTeamFinances', secure: true, },
      {command: 1100, httpmethod: 'post', uri: '/join-team', controller: joinTeamController, method: 'joinTeam', secure: true, },
      {command: 1105, httpmethod: 'post', uri: '/leave-team', controller: teamController, method: 'leaveTeam', secure: true, },
      {command: 1110, httpmethod: 'post', uri: '/change-team-location', controller: teamController, method: 'changeTeamLocation', secure: true, },
      {command: 1115, httpmethod: 'post', uri: '/rate-team', controller: rateTeamController, method: 'rateTeam', secure: true, },
      {command: 1125, httpmethod: 'post', uri: '/update-team', controller: teamController, method: 'updateTeam', secure: true, },
      {command: 1130, httpmethod: 'post', uri: '/update-team-finances', controller: updateTeamFinancesController, method: 'updateTeamFinances', secure: true, },
      {command: 1135, httpmethod: 'post', uri: '/check-user-right-to-delete-team', controller: teamController, method: 'checkUserRightToDeleteTeam', secure: true, },
      {command: 1140, httpmethod: 'post', uri: '/delete-team', controller: teamController, method: 'deleteTeam', secure: true, },
      {command: 1145, httpmethod: 'post', uri: '/check-user-right-to-leave-team', controller: teamController, method: 'checkUserRightToLeaveTeam', secure: true, },
      {command: 1150, httpmethod: 'post', uri: '/get-deleted-teams', controller: teamController, method: 'getDeletedTeams', secure: true, },
            
      {command: 3000, httpmethod: 'post', uri: '/get-team-followers', controller: teamController, method: 'getFollowers', secure: true, },
      {command: 3010, httpmethod: 'post', uri: '/follow-team', controller: teamController, method: 'followTeam', secure: true, },
      {command: 3020, httpmethod: 'post', uri: '/unfollow-team', controller: teamController, method: 'unfollowTeam', secure: true, },
      {command: 3030, httpmethod: 'post', uri: '/search-team-by-name', controller: teamController, method: 'searchTeamByName', secure: true, },
      {command: 3040, httpmethod: 'post', uri: '/get-last-updated-team', controller: teamController, method: 'getLastUpdatedTeam', secure: true, },
      {command: 3050, httpmethod: 'post', uri: '/get-team-rankings', controller: getTeamRegionalRankingsController, method: 'getTeamRankings', secure: true, },
      
      {command: 3100, httpmethod: 'post', uri: '/get-user-followers', controller: userController, method: 'getFollowers', secure: true, },
      {command: 3110, httpmethod: 'post', uri: '/follow-user', controller: userController, method: 'followUser', secure: true, },
      {command: 3120, httpmethod: 'post', uri: '/unfollow-user', controller: userController, method: 'unfollowUser', secure: true, },
      {command: 3130, httpmethod: 'post', uri: '/block-user', controller: blockUserController, method: 'blockUser', secure: true, },
      {command: 3135, httpmethod: 'post', uri: '/unblock-user', controller: blockUserController, method: 'unblockUser', secure: true, },
      {command: 3140, httpmethod: 'post', uri: '/get-followed-users', controller: userController, method: 'getFollowedUsers', secure: true, },
      {command: 3150, httpmethod: 'post', uri: '/get-blocked-users', controller: userController, method: 'getBlockedUsers', secure: true, },
      
      {command: 4000, httpmethod: 'post', uri: '/get-chat-session', controller: chatController, method: 'getChatSession', secure: true, },
      
      {command: 5050, httpmethod: 'post', uri: '/get-posts', controller: postController, method: 'getPosts', secure: true, },
      {command: 5051, httpmethod: 'post', uri: '/posts/get', controller: postController, method: 'getPosts', secure: true, },
      
      {command: 5055, httpmethod: 'post', uri: '/create-post', controller: postController, method: 'create', secure: true, },
      {command: 5060, httpmethod: 'post', uri: '/like-post', controller: postController, method: 'likePost', secure: true, },
      {command: 5065, httpmethod: 'post', uri: '/unlike-post', controller: postController, method: 'unlikePost', secure: true, },
      {command: 5070, httpmethod: 'post', uri: '/delete-post', controller: postController, method: 'deletePost', secure: true, },
      {command: 5075, httpmethod: 'post', uri: '/update-post', controller: postController, method: 'updatePost', secure: true, },
      
      {command: 5080, httpmethod: 'post', uri: '/post-comment', controller: postController, method: 'postComment', secure: true, },
      {command: 5090, httpmethod: 'post', uri: '/like-comment', controller: postController, method: 'likeComment', secure: true, },
      {command: 5095, httpmethod: 'post', uri: '/unlike-comment', controller: postController, method: 'unlikeComment', secure: true, },
      
      {command: 5150, httpmethod: 'post', uri: '/get-photos', controller: postController, method: 'getPhotos', secure: true, },
            
      {command: 6000, httpmethod: 'post', uri: '/get-newsfeed', controller: postController, method: 'getNewsfeed', secure: true, },
      
      {command: 7000, httpmethod: 'post', uri: '/has-updates', controller: userController, method: 'hasUpdates', secure: true, },
      
      {command: 8000, httpmethod: 'post', uri: '/global-search', controller: searchController, method: 'globalSearch', secure: true, },
      
      {command: 9000, httpmethod: 'post', uri: '/get-quickblox-data', controller: userController, method: 'getQuickbloxData', secure: true, },
      
      {command: 9999, httpmethod: 'post', uri: '/sandbox', controller: sandboxController, method: 'updateGroupChatPhoto', secure: true, },

      // Articles
      {command: 10000, httpmethod: 'post', uri: '/get-article', controller: getArticleController, method: 'getArticle', secure: false, },
      {command: 10010, httpmethod: 'post', uri: '/get-recent-articles', controller: getRecentArticlesController, method: 'getRecentArticles', secure: false, },
      {command: 10020, httpmethod: 'post', uri: '/get-vendor-articles', controller: getVendorArticlesController, method: 'getVendorArticles', secure: false, },
      {command: 10030, httpmethod: 'post', uri: '/get-vendor', controller: getVendorController, method: 'getVendor', secure: false, },
      {command: 10040, httpmethod: 'post', uri: '/get-vendors', controller: getVendorsController, method: 'getVendors', secure: false, },
      // Articles (admin, normal clients - ios app, android, webapp - don't access this)
      {command: 10050, httpmethod: 'post', uri: '/create-article', controller: createArticleController, method: 'createArticle', secure: false, },
      {command: 10060, httpmethod: 'post', uri: '/create-vendor', controller: createVendorController, method: 'createVendor', secure: false, },
      {command: 10070, httpmethod: 'post', uri: '/edit-article', controller: editArticleController, method: 'editArticle', secure: false, },
      {command: 10080, httpmethod: 'post', uri: '/edit-vendor', controller: editVendorController, method: 'editVendor', secure: false, },
      {command: 10090, httpmethod: 'post', uri: '/delete-article', controller: deleteArticleController, method: 'deleteArticle', secure: false, },
      {command: 10100, httpmethod: 'post', uri: '/delete-vendor', controller: deleteVendorController, method: 'deleteVendor', secure: false, },
      {command: 10110, httpmethod: 'post', uri: '/get-vendor-articles', controller: getVendorArticlesController, method: 'getVendorArticles', secure: false, },

      // Get admin token, currently only used for articles
      {command: 20000, httpmethod: 'post', uri: '/admin-login', controller: adminLoginController, method: 'adminLogin', secure: false, },
      // Check if token still valid
      {command: 20000, httpmethod: 'post', uri: '/admin-check', controller: adminCheckTokenController, method: 'checkToken', secure: false, },
      // Send email reset password to user
      {command: 30000, httpmethod: 'post', uri: '/send-email-reset-password', controller: resetPasswordController, method: 'sendEmailResetPassword', secure: false, },
      {command: 31000, httpmethod: 'post', uri: '/reset-user-password', controller: resetPasswordController, method: 'resetUserPassword', secure: false, },
      {command: 31010, httpmethod: 'post', uri: '/is-reset-password-url-valid', controller: resetPasswordController, method: 'isResetPasswordURLValid', secure: false, },

      // {command: 1120, endpoint: '', controller: DeleteTeamReques, method: '', secure: true, },
      // {command: 160, endpoint: '', controller: applyForGame, method: 'applyForGame', secure: true, },
      // {command: 130, endpoint: '', controller: createGame, method: 'createGame', secure: true, },
      // {command: 235, endpoint: '', controller: getGameAcceptedPlayers, method: 'getGameAcceptedPlayers', secure: true, },
      // {command: 170, endpoint: '', controller: getGameApplications, method: 'getGameApplications', secure: true, },
      // {command: 230, endpoint: '', controller: getGameInfo, method: 'getGameInfo', secure: true, },
      // {command: 190, endpoint: '', controller: getGameInvitesReceived, method: 'getGameInvitesReceived', secure: true, },
      // {command: 225, endpoint: '', controller: getJoinedGames, method: 'getJoinedGames', secure: true, },
      // {command: 220, endpoint: '', controller: getOwnedGames, method: 'getOwnedGames', secure: true, },
      // {command: 40, endpoint: '', controller: getProfile, method: 'getProfile', secure: true, },
      // {command: 45, endpoint: '', controller: getRegionalRankings, method: 'getRegionalRankings', secure: true, },
      // {command: 150, endpoint: '', controller: inviteToGame, method: 'inviteToGame', secure: true, },
      // {command: 240, endpoint: '', controller: leaveGame, method: 'leaveGame', secure: true, },
      // {command: 210, endpoint: '', controller: respondToGameApplication, method: 'respondToGameApplication', secure: true, },
      // {command: 180, endpoint: '', controller: respondToGameInvite, method: 'respondToGameInvite', secure: true, },
      // {command: 140, endpoint: '', controller: searchGame, method: 'searchGame', secure: true, },
    ];

    if(router) {
      for(var i = 0; i < routes.length; i = i + 1) {
        var route = routes[i];
        router.addRoute(route);
      }
    }

    return routes;

};
