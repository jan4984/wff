const local = {
    username: 'postgres',
    password: 'postgres',
    database: 'test',
    host: '127.0.0.1',
    dialect: 'postgres'
};

module.exports = {
    development: local,
    test: local,
    production: {
        username: process.env.SELF_DB_USER,
        password: process.env.SELF_DB_PASS,
        database: process.env.SELF_DB_NAME,
        host: process.env.SELF_DB_HOST,
        port: process.env.SELF_DB_PORT,
        dialect: 'postgres'
    }
};
