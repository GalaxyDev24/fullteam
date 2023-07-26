// Update with your config settings.

module.exports = {

    test: {
        client: 'mysql',
        connection: {
            host: 'full-team.ceamulusivas.eu-west-2.rds.amazonaws.com',
            database: 'fullteam',
            user: 'root',
            password: '',
            charset: 'utf8'
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/db/migrations'
        },
        seeds: {
            directory: __dirname + '/db/seeds/test'
        }
    },

    development: {
        client: 'mysql',
        connection: {
            host: 'full-team.ceamulusivas.eu-west-2.rds.amazonaws.com',
            database: 'fullteam',
            user: 'root',
            password: '',
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/db/migrations'
        },
        seeds: {
            directory: __dirname + '/db/seeds/test'
        }
    },

    production: {
        client: 'mysql',
        connection: {
            host: 'full-team.ceamulusivas.eu-west-2.rds.amazonaws.com',
            database: 'fullteam',
            user: 'root',
            password: '',
            charset: 'utf8'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        },
        seeds: {
            directory: './seeds/production'
        }
    }

};