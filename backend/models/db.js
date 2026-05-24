const mysql = require('mysql2');
require('dotenv').config();

class Database {
    constructor() {
        if (Database.instance) return Database.instance;
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10
        }).promise();
        Database.instance = this;
    }
    getPool() { return this.pool; }
}
module.exports = new Database();
