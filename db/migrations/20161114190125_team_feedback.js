exports.up = function(knex, Promise) {
    return knex.schema.createTableIfNotExists('team_feedback', function(table){
        table.bigIncrements('id').notNullable().primary();
        table.bigInteger('team_id').notNullable();
        table.bigInteger('from_user_id').notNullable();
        table.decimal('teamwork').notNullable();
        table.decimal('sportsmanship').notNullable();
        table.decimal('fitness').notNullable();
        table.decimal('reliability').notNullable();
        table.decimal('average').notNullable();
        table.string('feedback').notNullable();
        table.bigInteger('time_sent').notNullable();
        table.unique(['team_id', 'from_user_id']);
    });
};

exports.down = function(knex, Promise) {
    knex.schema.table('team_feedback', function(table) {
        table.dropPrimary();
        table.dropUnique(['team_id', 'from_user_id']);
    });
    return knex.schema.dropTableIfExists('team_feedback');
  
};
