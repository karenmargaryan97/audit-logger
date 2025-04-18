import { updateUser } from './userService.js';

const jsonSafeParse = (jsonString) => {
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		console.error('Failed to parse JSON:', error);
		return null;
	}
};

const [userId, data, adminId] = process.argv.slice(2);
(async () => {
	const updateData = jsonSafeParse(data);
	if (!updateData) {
		return;
	}

	await updateUser(userId, updateData, adminId);
	process.exit(0);
})();
