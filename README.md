# Audit Logger

This guide explains how to use the `init-db.js` and `update-user.js` scripts in this project.

## Prerequisites
1. Ensure you have Node.js (v22) and npm installed on your system.
2. Set up a PostgreSQL database. You can use Docker to run a PostgreSQL instance:
   ```bash
   docker run --name my-postgres \
   -e POSTGRES_USER=user \
   -e POSTGRES_PASSWORD=password \
   -e POSTGRES_DB=mydb \
   -p 5432:5432 \
   -d postgres:16
    ```
3. Install project dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory of the project with the following content:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/mydb
   SENSITIVE_FIELDS=email,phone,address
   ```

## Scripts
### 1. `init-db.js`
This script initializes the PostgreSQL database by creating the necessary tables and inserting sample data.
#### Usage
```bash
node init-dbClient.js <userId> # accepts test user ID as an argument
```
- `<userId>`: The ID of the test user to be inserted into the database (Default value: 1).

#### Example
```bash
node init-db.js 123
```

### 2. `update-user.js`
This script updates a user's information in the database and logs the changes of sensitive fields specified by `SENSITIVE_FIELDS` environment variable to the audit log.
#### Usage
```bash
node update-user.js <userId> <updatedData> <adminId>
```
- `<userId>`: The ID of the user to be updated.
- `<updatedData>`: User's updated data
- `<adminId>`: The ID of the admin making the update.

#### Example
```bash
node update-user.js 1 '{"email":"new@example.com", "phone":"123"}' 999
```