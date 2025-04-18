import { getPostgresClient } from './dbClient.js';
import joi from 'joi';

const sensitiveFields = (process.env.SENSITIVE_FIELDS || 'email,phone,address')
	.split(',').map(field => field.trim());

const validateUpdateUserInput = (data) => {
	const schema = joi.object({
		full_name: joi.string().optional(),
		email: joi.string().email().optional(),
		phone: joi.string().pattern(/^\+?[0-9]{7,15}$/).optional(),
		address: joi.string().min(1).max(255).optional(),
	});

	const { error } = schema.validate(data, { abortEarly: false, allowUnknown: false });


	if (error) {
		const errorMessage = error.details.map(err => err.message).join(', ');
		throw new Error(`Validation error: ${errorMessage}`);
	}
}

const isChanged = (userField, newField) => String(newField) !== String(userField);

const buildUpdateChanges = (data, newData) => {
	let index = 1;
	const updatedFields = [];
	const updatedValues = [];

	for (const [key, value] of Object.entries(newData)) {
		if (!isChanged(data[key], value)) {
			continue;
		}

		updatedFields.push(`${key} = $${index}`);
		updatedValues.push(value);
		index++;
	}

	return {
		updatedFields: updatedFields.join(', '),
		updatedValues,
	};
}

const getUpdateUserQuery = (user, newData) => {
	const { updatedFields, updatedValues } = buildUpdateChanges(user, newData);
	if (updatedValues.length === 0) {
		console.info('No changes detected for user with ID:', user.id);
		return null;
	}

	return {
		query: `UPDATE users SET ${updatedFields} WHERE id = $${updatedValues.length + 1}`,
		values: [...updatedValues, user.id],
	};
}

const getAuditLogQueries = (user, updatedData, adminId) => {
	const auditLogKeys = ['user_id', 'changed_by', 'field', 'old_value', 'new_value'];
	const queries = [];
	for (const [key, value] of Object.entries(updatedData)) {
		if (!sensitiveFields.includes(key) || !isChanged(user[key], value)) {
			continue;
		}

		const queryValues = auditLogKeys.map((_, i) => `$${i + 1}`).join(', ');
		queries.push({
			query: `INSERT INTO user_audit_logs (${auditLogKeys.join(', ')}) VALUES (${queryValues})`,
			values: [user.id, adminId, key, user[key], value]
		});
	}

	return queries;
};

const getUserById = (client) => async (userId) => {
	const { rows: [user] } = await client.query(`SELECT * FROM users WHERE id = $1`, [userId]);
	if (!user) {
		throw new Error(`User with ID ${userId} not found.`);
	}

	return user;
};

/**
 * Updates a user in the database and creates audit logs for sensitive field changes.
 * @param userId {number | string}
 * @param newData {object}
 * @param adminId {number | string}
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, newData, adminId) => {
	validateUpdateUserInput(newData);
	const validUserId = joi.attempt(Number(userId), joi.number().integer().min(1));
	const validAdminId = joi.attempt(Number(adminId), joi.number().integer().min(1));

	const client = await getPostgresClient();

	try {
		await client.query('BEGIN');

		const user = await getUserById(client)(validUserId);
		const updateQuery = getUpdateUserQuery(user, newData);
		const auditLogQueries = getAuditLogQueries(user, newData, validAdminId);

		if (!updateQuery) {
			return;
		}

		await Promise.all([
			client.query(updateQuery.query, updateQuery.values),
			...auditLogQueries.map(q => client.query(q.query, q.values)),
		]);

		await client.query('COMMIT');
		console.info(`User with ID: ${validUserId} was updated successfully.`);
	} catch (error) {
		await client.query('ROLLBACK');
		console.error(error);
	} finally {
		client.release();
	}
}
