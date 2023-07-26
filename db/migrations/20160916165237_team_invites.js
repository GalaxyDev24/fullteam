
exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('team_invites', function(table){
        table.bigInteger('team_id', 20).notNullable();
        table.bigInteger('user_id', 20).notNullable();
        table.integer('position').defaultTo(-1);      
        table.primary(['team_id', 'user_id']);  
    });    
};

exports.down = function(knex, Promise) {
    knex.schema.table('team_invites', function(table) {
        table.dropPrimary();
    });
    return knex.schema.dropTableIfExists('team_invites');   
};
