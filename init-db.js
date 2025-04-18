import { getPostgresClient } from './dbClient.js';
import fs from 'fs';
import path from 'path';

const [userId = 1] = process.argv.slice(2);

(async () => {
	const client = await getPostgresClient();

	try {
		const initSql = fs.readFileSync(path.resolve('./schema.sql'), 'utf8');
		await client.query(initSql);
		console.info('Database initialized!');

		const { rows: [testUser] } = await client.query(`SELECT * FROM users WHERE id = $1`, [Number(userId)]);
		if (!testUser) {
			await client.query(`INSERT INTO users (id, full_name, email, phone, address) VALUES ($1, $2, $3, $4, $5)`,
				[Number(userId), 'Test User', 'test@gmail.com', '123456789', 'Madagascar, Antananarivo, 101'],
			);

			console.info(`Test user created with ID: "${userId}"!`);
		}
	} catch (error) {
		console.error('Error initializing database:', error);
		process.exit(1);
	} finally {
		client.release();
		console.info('Database connection closed!');
		process.exit(0);
	}
})();
