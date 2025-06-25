require('module-alias/register');

const mysql = require('mysql2/promise');
const config = require('@config');

async function createTables() {
	let connection;

	try {
		console.log('Connecting to MySQL...');
		connection = await mysql.createConnection({
			host: config.dbConfig.host,
			user: config.dbConfig.user,
			password: config.dbConfig.password,
			database: config.dbConfig.database,
		});

		console.log('Creating tables...');

		const queries = [
			`CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(255),
                password_hash VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );`,
			`CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            );`,
			`CREATE TABLE IF NOT EXISTS auth_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            );`,
            `CREATE TABLE IF NOT EXISTS user_emails (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                is_valid BOOLEAN DEFAULT TRUE,
                is_subscribed BOOLEAN DEFAULT FALSE,
                validation_token VARCHAR(255),
                validated_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY (user_id, email)
            );`,
			`CREATE TABLE IF NOT EXISTS currencies (
                code VARCHAR(10) PRIMARY KEY,
                name VARCHAR(50) NOT NULL,
                symbol VARCHAR(10),
                decimals INT DEFAULT 8
            );`,
			`CREATE TABLE IF NOT EXISTS transaction_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                description VARCHAR(255)
            );`,
			`CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                transaction_type_id INT NOT NULL,
                currency_code VARCHAR(10) NOT NULL,
                amount DECIMAL(24,9) NOT NULL CHECK (amount >= 0),
                tx_hash VARCHAR(255) UNIQUE NOT NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (transaction_type_id) REFERENCES transaction_types(id),
                FOREIGN KEY (currency_code) REFERENCES currencies(code)
            );`,
			`CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id INT NOT NULL,
                to_address VARCHAR(80) NOT NULL,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
            );`,
			`CREATE TABLE IF NOT EXISTS authentication_providers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                service_id INT NOT NULL,
                auth_type_id INT NOT NULL,
                client_id VARCHAR(255),
                client_secret VARCHAR(255),
                auth_url VARCHAR(255),
                token_url VARCHAR(255),
                scopes VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                FOREIGN KEY (auth_type_id) REFERENCES auth_types(id)
            );`,
			`CREATE TABLE IF NOT EXISTS user_authentications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                provider_id INT NOT NULL,
                provider_user_id VARCHAR(255),
                access_token VARCHAR(255),
                refresh_token VARCHAR(255),
                token_expiry DATETIME,
                additional_data JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (provider_id) REFERENCES authentication_providers(id)
            );`,
			`CREATE TABLE IF NOT EXISTS wallets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                currency_code VARCHAR(10) NOT NULL,
                public_address VARCHAR(80) NOT NULL,
                balance DECIMAL(24,9) NOT NULL DEFAULT 0.000000000,
                qr_code BLOB,
                is_retired BOOLEAN DEFAULT FALSE,
                retired_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (currency_code) REFERENCES currencies(code),
                UNIQUE KEY (user_id, currency_code)
            );`,
			`CREATE TABLE IF NOT EXISTS tips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_id INT NOT NULL,
                sender_user_id INT NOT NULL,
                message VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,
			`CREATE TABLE IF NOT EXISTS tip_recipients (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tip_id INT NOT NULL,
                recipient_user_id INT,
                recipient_username VARCHAR(50),
                amount DECIMAL(24,9) NOT NULL CHECK (amount > 0),
                FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE,
                FOREIGN KEY (recipient_user_id) REFERENCES users(id)
            );`,
			`CREATE TABLE IF NOT EXISTS promotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                start_date DATETIME,
                end_date DATETIME
            );`,
			`CREATE TABLE IF NOT EXISTS user_promotions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                promotion_id INT NOT NULL,
                is_redeemed BOOLEAN DEFAULT FALSE,
                redemption_date DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (promotion_id) REFERENCES promotions(id)
            );`,
			`CREATE TABLE IF NOT EXISTS users_agree (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                has_agreed BOOLEAN NOT NULL,
                agreed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );`,
			`CREATE TABLE IF NOT EXISTS future_tips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tip_id INT NOT NULL,
                recipient_username VARCHAR(50) NOT NULL,
                amount DECIMAL(24,9) NOT NULL CHECK (amount > 0),
                currency_code VARCHAR(10) NOT NULL,
                is_paid_out BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE,
                FOREIGN KEY (currency_code) REFERENCES currencies(code)
            );`,
			`CREATE TABLE IF NOT EXISTS web3_wallets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                blockchain VARCHAR(50) NOT NULL,
                public_address VARCHAR(42) NOT NULL,
                is_primary BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY (public_address, blockchain)
            );`,
			`CREATE TABLE IF NOT EXISTS web3_verifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                web3_wallet_id INT NOT NULL,
                signature VARCHAR(255) NOT NULL,
                message VARCHAR(255) NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (web3_wallet_id) REFERENCES web3_wallets(id) ON DELETE CASCADE
            );`,
			`CREATE TABLE IF NOT EXISTS nonces (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                web3_wallet_id INT NOT NULL,
                nonce VARCHAR(255) NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (web3_wallet_id) REFERENCES web3_wallets(id) ON DELETE CASCADE
            );`,
		];

		for (const query of queries) {
			await connection.execute(query);
		}

		console.log('All tables created successfully.');
	}
	catch (error) {
		console.error('Error during table creation:', error.message);
	}
	finally {
		if (connection) {
			await connection.end();
		}
	}
}

// Call the function and handle any errors
createTables().catch(err => {
	console.error('Unexpected error:', err);
	process.exit(1);
});

