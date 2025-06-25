require('module-alias/register');

const mysql = require('mysql2/promise');
const config = require('@config');

async function populateTestData() {
    let connection;

    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            host: config.dbConfig.host,
            user: config.dbConfig.user,
            password: config.dbConfig.password,
            database: config.dbConfig.database
        });

        console.log('Populating test data...');

        // Insert test data into services
        await connection.execute(`
            INSERT INTO services (name) VALUES
            ('discord'),
            ('twitter'),
            ('github')
        `);

        // Insert test data into auth_types
        await connection.execute(`
            INSERT INTO auth_types (name) VALUES
            ('oauth2'),
            ('api_key'),
            ('password')
        `);

        // Insert test data into users
        await connection.execute(`
            INSERT INTO users (username, email, password_hash) VALUES
            ('testuser1', 'testuser1@example.com', 'hashedpassword1'),
            ('testuser2', 'testuser2@example.com', 'hashedpassword2')
        `);

        // Insert test data into currencies
        await connection.execute(`
            INSERT INTO currencies (code, name, symbol, decimals) VALUES
            ('QRL', 'Quantum Resistant Ledger', 'Ξ', 8),
            ('ZOND', 'Zond', 'Z', 9)
        `);

        // Insert test data into wallets with corrected Zond public addresses
        await connection.execute(`
            INSERT INTO wallets (user_id, currency_code, public_address, balance) VALUES
            (1, 'QRL', 'Q010300284cc14642e9b2978218f70fcf76274d67d82f3cf7d9038d0e3e43bacfe293773f803931', 1000.000000000),
            (1, 'ZOND', '0x20d20b8026b8f02540246f58120ddaaf35aecd9b', 500.000000000),
            (2, 'QRL', 'Q010300285ff23ff42e9b2978218f70fcf76334d67d82f3cf7d9038d0e3e43bacfe293773f803932', 750.000000000)
        `);

        // Insert test data into transaction types
        await connection.execute(`
            INSERT INTO transaction_types (name, description) VALUES
            ('tip', 'User-to-user tip'),
            ('withdrawal', 'Withdrawal to external address'),
            ('deposit', 'User deposit'),
            ('promotion_payout', 'Payout from a promotion')
        `);

        // Insert test data into transactions
        await connection.execute(`
            INSERT INTO transactions (user_id, transaction_type_id, currency_code, amount, tx_hash, status) VALUES
            (1, 1, 'QRL', 100.000000000, '0xabc123hash', 'completed'),
            (2, 3, 'ZOND', 50.000000000, '0xdef456hash', 'completed')
        `);

        // Insert test data into tips
        await connection.execute(`
            INSERT INTO tips (transaction_id, sender_user_id, message) VALUES
            (1, 1, 'Here’s a tip for you!')
        `);

        // Insert test data into tip_recipients
        await connection.execute(`
            INSERT INTO tip_recipients (tip_id, recipient_user_id, amount) VALUES
            (1, 2, 50.000000000)
        `);

        console.log('Test data populated successfully.');
    } catch (error) {
        console.error('Error during test data population:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Call the function and handle any errors
populateTestData().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

