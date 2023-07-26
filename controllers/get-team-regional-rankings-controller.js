var knex = require('lib/knex'),
    q = require('q'),
    async = require('async'),
    validate = require("validate.js");

var Controller = require('controllers/controller');

var requestConstraints = {
    TeamID: {
        presence: {
            message: "is required"
        }
    },
};

function GetTeamRegionalRankingsController() {
    var ctrl = new Controller(this);
    this.getTeamRankings = function(packet) {
        var distance = 100;
        var data = packet.data;
        var response = {};
        var deferred = q.defer();

        async.waterfall([
            // Data validation...
            function(callback) {
                var errors = validate(data, requestConstraints);

                if (!errors) {
                    return callback(null);
                }

                return ctrl.errorCallback(callback, 1, "Invalid Parameters", errors);

            },
            // Get user location...
            function(callback) {
                knex
                    .select([
                        'lat',
                        'lon',
                    ])
                    .from('teams')
                    .where('id', data.TeamID)
                    .whereNull('deleted_at')
                    .first()
                    .then(function(teamLocation) {
                        
                        if (typeof teamLocation === 'undefined') {
                            return ctrl.errorCallback(callback, 1, "Team not found");
                        }

                        response.TeamLocation = teamLocation;

                        return callback(null);

                    }, function(err) {
                        return ctrl.errorCallback(callback, 1, "Team location does not exist.", err);
                    });
            },

            // Get team average rating
            function(callback) {
                knex
                    .select([
                        knex.raw("IFNULL(AVG(average), -1) as rating"),
                    ])
                    .from('team_feedback')
                    .innerJoin('teams', 'team_feedback.team_id', 'teams.id')
                    .where('team_id', data.TeamID)
                    .whereNull('teams.deleted_at')
                    .first()
                    .then(function(teamRating) {
                        response.TeamRating = teamRating.rating;
                        return callback(null);
                    }, function(err) {
                        return ctrl.errorCallback(callback, 1, "Team location does not exist.", err);
                    });
            },

            // Get number of teams having better rating in that region...
            function(callback) {

                /*SELECT
                COUNT(t.id) AS num_teams
                FROM teams t
                LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = t.id
                WHERE 1 = 1
                AND GETDISTANCE(t.lat, t.lon, 50.92036187, 0.08168799) < 100
                AND tf.rating > (SELECT AVG(average) FROM team_feedback WHERE team_id = 30)
                ORDER BY tf.rating DESC*/

                knex
                    .select([
                        knex.raw("count(teams.id) as num_teams"),
                    ])
                    .from('teams')
                    .joinRaw('LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = teams.id')
                    .whereRaw("GETDISTANCE(teams.lat, teams.lon, ?, ?) < ?", [response.TeamLocation.lat, response.TeamLocation.lon, distance])
                    .where('tf.rating', '>', response.TeamRating)
                    .whereNull('teams.deleted_at')
                    .orderBy('tf.rating', 'DESC')
                    .first()
                    .then(function(numTeams) {

                        if (typeof numTeams === 'undefined') {
                            return ctrl.errorCallback(callback, 1, "Team not found");
                        }
                        response.TeamRanking = parseInt(numTeams.num_teams) + 1;
                        return callback(null);
                    }, function(err) {
                        return ctrl.errorCallback(callback, 1, "Unknown error", err);
                    });
            },

            // Get number of users in that region...
            function(callback) {

                /*SELECT
                COUNT(t.id) AS num_teams
                FROM teams t
                LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = t.id
                WHERE 1 = 1
                AND GETDISTANCE(t.lat, t.lon, 50.92036187, 0.08168799) < 100*/

                knex
                    .select([
                        knex.raw("count(teams.id) as num_teams"),
                    ])
                    .from('teams')
                    .joinRaw('LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = teams.id')
                    .whereRaw("tf.rating IS NOT NULL AND GETDISTANCE(teams.lat, teams.lon, ?, ?) < ? ", [response.TeamLocation.lat, response.TeamLocation.lon, distance])
                    .whereNull('teams.deleted_at')
                    .first()
                    .then(function(numTeams) {

                        if (typeof numTeams === 'undefined') {
                            return ctrl.errorCallback(callback, 1, "Team not found");
                        }

                        response.TeamsInRegion = parseInt(numTeams.num_teams);
                        return callback(null);
                    }, function(err) {
                        return ctrl.errorCallback(callback, 1, "Unknown error");
                    });
            },

            // Get the list of top 10 users in that region...
            function(callback) {

                /*SELECT
                    t.id,
                    t.name AS TeamName,
                    t.picture AS PictureURL,
                    tf.rating AS Rating,
                    GETDISTANCE(lat, lon, '-20.37', '57.61') AS Distance
                FROM teams t  
                LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = t.id
                WHERE 1 = 1
                AND GETDISTANCE(t.lat, t.lon, 50.92036187, 0.08168799) < 100
                ORDER BY tf.rating DESC
                LIMIT 10*/

                knex
                    .select([
                        'teams.id AS TeamID',
                        knex.raw("teams.name AS TeamName"),
                        knex.raw("teams.picture AS PictureURL"),
                        knex.raw("tf.rating AS Rating"),
                    ])
                    .from('teams')
                    .joinRaw('LEFT JOIN (SELECT AVG(average) AS rating, team_id FROM team_feedback GROUP BY team_id) tf ON tf.team_id = teams.id')
                    .whereRaw(" tf.rating IS NOT NULL AND GETDISTANCE(teams.lat, teams.lon, ?, ?) < ?", [response.TeamLocation.lat, response.TeamLocation.lon, distance])
                    .whereNull('teams.deleted_at')
                    .orderBy('tf.rating', 'DESC')
                    .limit(10)
                    .then(function(LeaderBoard) {
                        if (typeof LeaderBoard === 'undefined') {
                            return ctrl.errorCallback(callback, 1, "Could not retreive leaderboard");
                        }

                        response.LeaderBoard  = LeaderBoard;

                        return callback(null, response);
                    }, function(err) {
                        return ctrl.errorCallback(callback, 1, "Unknown error");
                    });
            },

        ], ctrl.asyncCallback(deferred));
        return deferred.promise;
    };
}

module.exports = new GetTeamRegionalRankingsController();