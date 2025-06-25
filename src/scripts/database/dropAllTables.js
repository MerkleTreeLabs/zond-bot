require('module-alias/register');

const mysql = require('mysql2/promise');
const config = require('@config');

async function dropAllTables() {
    let connection;

    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: config.dbConfig.host,
            user: config.dbConfig.user,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        // Disable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Foreign key checks disabled.');

        console.log('Retrieving all table names...');
        const [tables] = await connection.execute(`
            SELECT table_name AS tableName
            FROM information_schema.tables
            WHERE table_schema = ?
        `, [config.dbConfig.database]);

        if (tables.length === 0) {
            console.log('No tables found to drop.');
            return;
        }

        console.log('Dropping all tables...');
        for (const { tableName } of tables) {
            await connection.execute(`DROP TABLE IF EXISTS \`${tableName}\``);
            console.log(`Dropped table: ${tableName}`);
        }

        // Re-enable foreign key checks
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Foreign key checks re-enabled.');
        console.log('All tables dropped successfully.');
    } catch (error) {
        console.error('Error during table dropping:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Call the function and handle any errors
dropAllTables().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

