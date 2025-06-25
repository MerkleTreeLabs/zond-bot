require('module-alias/register');

const mysql = require('mysql2/promise');
const config = require('@config');

async function deleteDatabase() {
    let connection;

    try {
        // Connect to MySQL using credentials from the config file
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: config.dbConfig.host,
            user: config.dbConfig.rootUser,
            password: config.dbConfig.rootPassword
        });

        // Check if the database exists
        const [databases] = await connection.execute(`SHOW DATABASES LIKE '${config.dbConfig.database}'`);

        if (databases.length > 0) {
            // Delete the database if it exists
            console.log(`Dropping database "${config.dbConfig.database}"...`);
            await connection.execute(`DROP DATABASE \`${config.dbConfig.database}\``);
            console.log('Database deleted successfully.');
        } else {
            console.log(`Database "${config.dbConfig.database}" does not exist.`);
        }

    } catch (error) {
        console.error('Error during database deletion:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Call the function and handle any errors
deleteDatabase().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

