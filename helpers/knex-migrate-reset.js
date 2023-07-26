let knex = require('lib/knex');
let moment = require('moment');

module.exports = function() {
  let migrate = knex.migrate;

  console.log("Force unlock migrations");

  let deferred = q.defer();

  // Force unlock in case of bad state
  migrate.forceFreeMigrationsLock()
  // Get the names of all the tables in the DB with Mysql's SHOW TABLES command.
    .then(knex.raw("SHOW TABLES")
      // Use these names to truncate all the data
      .then(function(names) {
        let prevMillis = new Date().getTime();
        console.log("Truncating database...");
        var tasks = [];
        var key = Object.keys(names[0][0])[0];
        for (var ii = 0; ii < names[0].length; ++ii) {
          tasks.push(knex.raw("TRUNCATE " + names[0][ii][key]));
        }
        return Promise.all(tasks)
          .then(function() {
            let currMillis = new Date().getTime();
            let diff = currMillis - prevMillis;
            console.log("Took: " + diff + " millis.");
          })
          .then(function() {
            console.log("Running seeds...");
            let prevMillis = new Date().getTime();
            return knex.seed.run()
              .then(function() { 
                let currMillis = new Date().getTime();
                let diff = currMillis - prevMillis;
                console.log("Took: " + diff + " millis.");
                deferred.resolve();
              });
          });
      })    
    )
    .catch(function(err) {
      console.log("Error occurred whilst resetting database for tests");
      console.log(err);
      deferred.reject(err);
    });

  return deferred.promise;
};
