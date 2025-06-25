require('module-alias/register');

const mysql = require('mysql2/promise');
const config = require('@config');

async function createDatabaseAndUser() {
    let connection;

    try {
        // Connect to MySQL using credentials from the config file
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: config.dbConfig.host,
            user: config.dbConfig.rootUser,
            password: config.dbConfig.rootPassword
        });

        // Check if the database already exists
        const [databases] = await connection.execute(`SHOW DATABASES LIKE '${config.dbConfig.database}'`);

        if (databases.length === 0) {
            // Create the database if it does not exist
            console.log(`Creating database "${config.dbConfig.database}"...`);
            await connection.execute(`CREATE DATABASE \`${config.dbConfig.database}\``);
        }

        // Check if the user already exists
        const [users] = await connection.execute(`SELECT EXISTS(SELECT 1 FROM mysql.user WHERE user = '${config.dbConfig.user}') as user_exists`);
        
        if (!users[0].user_exists) {
            // Create the user if it does not exist
            console.log(`Creating user "${config.dbConfig.user}"...`);
            await connection.execute(`CREATE USER '${config.dbConfig.user}'@'localhost' IDENTIFIED BY '${config.dbConfig.password}'`);
        }

        // Grant necessary privileges to the user on the database
        await connection.execute(`GRANT ALL PRIVILEGES ON \`${config.dbConfig.database}\`.* TO '${config.dbConfig.user}'@'localhost'`);
        await connection.execute('FLUSH PRIVILEGES');

        console.log('Database and user setup complete.');

    } catch (error) {
        console.error('Error during database creation:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Call the function and handle any errors
createDatabaseAndUser().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

