var feedback = require('db/sample-data/sample-data.js').userfeedback;

exports.seed = function(knex, Promise) {
  var tasks = [];
  for (var i = 0; i < feedback.length; i++) {

    var sampleData = {
      from_user_id: feedback[i][1],
      profile_user_id: feedback[i][0],
      passing: feedback[i][2],
      shooting: feedback[i][3],
      fitness: feedback[i][4],
      reliability: feedback[i][5],
      average: (feedback[i][2] + feedback[i][3] + feedback[i][4] + feedback[i][5]) /4,
      feedback: feedback[i][6],
      time_sent: feedback[i][7],
    }

    tasks.push(knex('user_feedback').insert(sampleData));
  }

  // Deletes ALL existing entries
  return knex('user_feedback').truncate().then(function() {
    return Promise.all(tasks);
  });

};
