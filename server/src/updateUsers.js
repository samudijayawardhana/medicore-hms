import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'medicore_db';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  const conn = await mysql.createConnection({ host, user, password, database, port });
  try {
    await conn.query('ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL AFTER id');
    console.log('Added username column');
  } catch (e) {
    console.log('Column notice:', e.message);
  }

  await conn.query(`
    UPDATE users SET username = CASE id 
      WHEN 1 THEN 'admin' 
      WHEN 2 THEN 'doctor' 
      WHEN 3 THEN 'dr.kanishka' 
      WHEN 4 THEN 'dr.menaka' 
      WHEN 5 THEN 'nurse' 
      WHEN 6 THEN 'receptionist' 
      WHEN 7 THEN 'lab' 
      WHEN 8 THEN 'pharmacist' 
      WHEN 9 THEN 'accountant' 
      ELSE CONCAT('user', id) 
    END
  `);

  const [rows] = await conn.query('SELECT u.id, u.username, u.name, u.email, r.name as role FROM users u JOIN roles r ON u.role_id = r.id');
  console.log('Users in medicore_db:', rows);
  await conn.end();
}

run().catch(console.error);
