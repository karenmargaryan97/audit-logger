import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

let client;

export async function getPostgresClient() {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set in the environment variables');
	}

	if (!client) {
		const pool = new pg.Pool({
			connectionString: process.env.DATABASE_URL,
		});
		client = await pool.connect();

		console.info('Database connection established!');
	}

	return client;
}
