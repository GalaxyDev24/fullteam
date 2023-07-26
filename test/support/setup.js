// setup.js 

before(function(done) {
    var start = new Date();
    var hrstart = process.hrtime();
    this.timeout(180000);
    var reset = require('helpers/knex-migrate-reset');
    reset().then(function(){
        console.log('Database Reset Complete');   

        var end = new Date() - start,
            hrend = process.hrtime(hrstart);

        console.info("Execution time: %dms", end);
        console.info("Execution time (hr): %ds %dms", hrend[0], hrend[1]/1000000);

        // process.exit()
 
        done();

    });
});
