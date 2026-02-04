const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

/* ================== MYSQL CONNECTION (POOL) ================== */
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'metro.proxy.rlwy.net',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'SvusvxgCmsWEIveqfXCDDeVaZfLyBSNJ',
  database: process.env.MYSQLDATABASE || 'railway',
  port: process.env.MYSQLPORT || 49980,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // IMPORTANT!
});

const db = pool;

// Test database connection
db.getConnection((err, conn) => {
  if (err) {
    console.log("❌ MySQL Connection Failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL database");
    conn.release();
  }
});

/* ================== ROUTES ================== */

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ BACKEND SERVER IS RUNNING!',
    port: process.env.PORT || 5000,
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toLocaleString(),
    railwayUrl: 'https://unique-beauty.up.railway.app'
  });
});

/* ================== DEBUG DATABASE ================== */
app.get('/api/debug-db', async (req, res) => {
  try {
    // Test connection
    const [test] = await db.promise().query('SELECT 1 as test');
    
    // Get all users (handle if table doesn't exist)
    let users = [];
    try {
      const [userRows] = await db.promise().query(
        'SELECT id, first_name, email, status FROM users ORDER BY id DESC'
      );
      users = userRows;
    } catch (tableError) {
      console.log('⚠️ Users table might not exist yet:', tableError.message);
    }
    
    res.json({
      success: true,
      dbConnected: true,
      testResult: test[0].test,
      totalUsers: users.length,
      users: users,
      message: 'Database connection successful',
      credentials: {
        host: process.env.MYSQLHOST || 'metro.proxy.rlwy.net',
        database: process.env.MYSQLDATABASE || 'railway',
        port: process.env.MYSQLPORT || 49980
      }
    });
  } catch (err) {
    console.error('❌ Database debug error:', err);
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: err.message,
      sqlState: err.sqlState,
      code: err.code
    });
  }
});

/* ================== CHECK TABLE STRUCTURE ================== */
app.get('/api/check-table', async (req, res) => {
  try {
    // Check users table structure (handle if table doesn't exist)
    let structure = [];
    let statusValues = [];
    let tableExists = true;
    
    try {
      const [structureRows] = await db.promise().query('DESCRIBE users');
      structure = structureRows;
      
      const [statusRows] = await db.promise().query(
        'SELECT DISTINCT status, COUNT(*) as count FROM users GROUP BY status'
      );
      statusValues = statusRows;
    } catch (tableError) {
      tableExists = false;
      console.log('⚠️ Users table does not exist yet');
    }
    
    res.json({
      success: true,
      tableExists: tableExists,
      tableStructure: structure,
      statusValues: statusValues,
      message: tableExists ? 'Table check successful' : 'Users table does not exist yet'
    });
  } catch (err) {
    console.error('❌ Table check error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ================== CREATE USERS TABLE IF NOT EXISTS ================== */
app.post('/api/create-users-table', async (req, res) => {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approve', 'rejected', 'reject') DEFAULT 'pending',
        role ENUM('admin', 'citizen', 'staff') DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    const [result] = await db.promise().query(createTableSQL);
    
    // Insert sample data if table was created
    const insertSampleSQL = `
      INSERT IGNORE INTO users (first_name, email, password, status, role) VALUES
      ('Admin User', 'admin@barangay.com', 'admin123', 'approve', 'admin'),
      ('Juan Dela Cruz', 'juan@email.com', 'password123', 'approve', 'citizen'),
      ('Maria Santos', 'maria@email.com', 'password123', 'pending', 'citizen')
    `;
    
    const [insertResult] = await db.promise().query(insertSampleSQL);
    
    res.json({
      success: true,
      message: 'Users table created successfully',
      created: result.warningStatus === 0,
      sampleDataInserted: insertResult.affectedRows,
      warnings: result.warningStatus
    });
  } catch (err) {
    console.error('❌ Create table error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      sqlState: err.sqlState
    });
  }
});

/* ================== CITIZEN LOGIN ================== */
app.post("/citizen-login", async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt:", email);

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ success: false, error: "Email not found" });

    const user = users[0];

    if (user.password !== password)
      return res.status(401).json({ success: false, error: "Incorrect password" });

    if (user.status !== 'approve')
      return res.status(401).json({ success: false, error: `Account not approved. Status: ${user.status}` });

    res.json({
      success: true,
      message: "Login successful",
      citizen: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role || "citizen"
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ================== SIGNUP ================== */
app.post("/signup", async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const sql = `INSERT INTO users (first_name, email, password, status, role)
                 VALUES (?, ?, ?, 'pending', 'citizen')`;

    const [result] = await db.promise().query(sql, [full_name, email, password]);

    res.json({
      success: true,
      message: "Registration successful - pending approval",
      userId: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, error: "Email already exists" });

    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

/* ================== ADMIN LOGIN ================== */
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.promise().query(
      "SELECT * FROM users WHERE email = ? AND role = 'admin'",
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ success: false, error: "Admin not found" });

    const user = users[0];

    if (user.password !== password)
      return res.status(401).json({ success: false, error: "Incorrect password" });

    res.json({
      success: true,
      message: "Admin login successful",
      admin: {
        id: user.id,
        first_name: user.first_name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

/* ================== DEBUG USERS ================== */
app.get("/debug-users", async (req, res) => {
  try {
    const [users] = await db.promise().query(
      "SELECT id, first_name, email, role, status FROM users ORDER BY id DESC"
    );

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ================== GET PENDING USERS ================== */
app.get('/api/pending-users', async (req, res) => {
  console.log("📥 Fetching pending users from database...");
  
  try {
    const [rows] = await db.promise().query(
      `SELECT id, first_name, email, status, created_at
       FROM users 
       WHERE status = 'pending'
       ORDER BY id DESC`
    );

    console.log(`✅ Found ${rows.length} pending users`);
    res.json({ success: true, users: rows, count: rows.length });
  } catch (error) {
    console.error('❌ Error fetching pending users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pending users' });
  }
});

/* ================== APPROVE USER - ENHANCED ================== */
app.post('/api/approve-user', async (req, res) => {
  const { userId } = req.body;
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ APPROVE USER REQUEST RECEIVED`);
  console.log('='.repeat(50));
  console.log(`📦 Request body:`, req.body);
  console.log(`👤 User ID to approve: ${userId}`);
  console.log('='.repeat(50));
  
  if (!userId) {
    console.log(`❌ ERROR: No userId provided`);
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  try {
    // Check if user exists first
    console.log(`🔍 Checking if user ${userId} exists...`);
    const [check] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`📊 User check result:`, check);
    
    if (check.length === 0) {
      console.log(`❌ ERROR: User ${userId} not found in database`);
      return res.status(404).json({ 
        success: false, 
        error: `User ID ${userId} not found` 
      });
    }
    
    console.log(`📋 User found:`, check[0]);
    console.log(`📋 Current status: ${check[0].status}`);
    
    // Update the user
    console.log(`🔄 Updating user ${userId} status to "approve"...`);
    const sql = 'UPDATE users SET status = "approve" WHERE id = ?';
    console.log(`📝 SQL: ${sql}`);
    console.log(`📝 Parameter: ${userId}`);
    
    const [result] = await db.promise().query(sql, [userId]);
    
    console.log(`📊 UPDATE RESULT:`, result);
    console.log(`✅ Affected rows: ${result.affectedRows}`);
    console.log(`✅ Changed rows: ${result.changedRows}`);
    
    if (result.affectedRows === 0) {
      console.log(`⚠️ WARNING: No rows affected. User may already be approved.`);
    }
    
    // Verify the update
    console.log(`🔍 Verifying update...`);
    const [updated] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`✅ VERIFICATION RESULT:`, updated[0]);
    console.log('='.repeat(50));
    console.log(`🎉 APPROVE COMPLETED SUCCESSFULLY`);
    console.log('='.repeat(50) + '\n');
    
    res.json({ 
      success: true, 
      message: 'User approved successfully',
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      user: updated[0]
    });
    
  } catch (error) {
    console.error(`🔥 CRITICAL ERROR APPROVING USER ${userId}:`);
    console.error(`  Error name: ${error.name}`);
    console.error(`  Error message: ${error.message}`);
    console.error(`  Error code: ${error.code}`);
    console.error(`  SQL State: ${error.sqlState}`);
    console.error(`  Full error:`, error);
    console.log('='.repeat(50) + '\n');
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to approve user',
      details: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  }
});

/* ================== REJECT USER - ENHANCED ================== */
app.post('/api/reject-user', async (req, res) => {
  const { userId } = req.body;
  
  console.log('\n' + '='.repeat(50));
  console.log(`❌ REJECT USER REQUEST RECEIVED`);
  console.log('='.repeat(50));
  console.log(`📦 Request body:`, req.body);
  console.log(`👤 User ID to reject: ${userId}`);
  console.log('='.repeat(50));
  
  if (!userId) {
    console.log(`❌ ERROR: No userId provided`);
    return res.status(400).json({ 
      success: false, 
      error: 'User ID is required' 
    });
  }
  
  try {
    // Check if user exists first
    console.log(`🔍 Checking if user ${userId} exists...`);
    const [check] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`📊 User check result:`, check);
    
    if (check.length === 0) {
      console.log(`❌ ERROR: User ${userId} not found in database`);
      return res.status(404).json({ 
        success: false, 
        error: `User ID ${userId} not found` 
      });
    }
    
    console.log(`📋 User found:`, check[0]);
    console.log(`📋 Current status: ${check[0].status}`);
    
    // Try to update - TRY BOTH 'rejected' and 'reject'
    console.log(`🔄 Updating user ${userId} status to "rejected"...`);
    
    let result;
    let statusUsed = 'rejected';
    
    try {
      // First try 'rejected'
      const sql = 'UPDATE users SET status = ? WHERE id = ?';
      console.log(`📝 SQL: ${sql}`);
      console.log(`📝 Parameters: ["${statusUsed}", ${userId}]`);
      
      [result] = await db.promise().query(sql, [statusUsed, userId]);
      
    } catch (sqlError) {
      console.log(`⚠️ First attempt failed, trying 'reject' instead...`);
      statusUsed = 'reject';
      
      const sql = 'UPDATE users SET status = ? WHERE id = ?';
      console.log(`📝 SQL: ${sql}`);
      console.log(`📝 Parameters: ["${statusUsed}", ${userId}]`);
      
      [result] = await db.promise().query(sql, [statusUsed, userId]);
    }
    
    console.log(`📊 UPDATE RESULT:`, result);
    console.log(`✅ Affected rows: ${result.affectedRows}`);
    console.log(`✅ Changed rows: ${result.changedRows}`);
    
    if (result.affectedRows === 0) {
      console.log(`⚠️ WARNING: No rows affected. User may already be rejected.`);
    }
    
    // Verify the update
    console.log(`🔍 Verifying update...`);
    const [updated] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users WHERE id = ?',
      [userId]
    );
    
    console.log(`✅ VERIFICATION RESULT:`, updated[0]);
    console.log('='.repeat(50));
    console.log(`🎉 REJECT COMPLETED SUCCESSFULLY`);
    console.log('='.repeat(50) + '\n');
    
    res.json({ 
      success: true, 
      message: `User rejected successfully (status set to: ${statusUsed})`,
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      statusUsed: statusUsed,
      user: updated[0]
    });
    
  } catch (error) {
    console.error(`🔥 CRITICAL ERROR REJECTING USER ${userId}:`);
    console.error(`  Error name: ${error.name}`);
    console.error(`  Error message: ${error.message}`);
    console.error(`  Error code: ${error.code}`);
    console.error(`  SQL State: ${error.sqlState}`);
    console.error(`  Full error:`, error);
    console.log('='.repeat(50) + '\n');
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reject user',
      details: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
  }
});

/* ================== DIRECT MANUAL UPDATE ================== */
app.post('/api/update-status', async (req, res) => {
  const { userId, newStatus } = req.body;
  
  console.log(`🔄 Manual update: User ${userId} -> ${newStatus}`);
  
  try {
    const [result] = await db.promise().query(
      'UPDATE users SET status = ? WHERE id = ?',
      [newStatus, userId]
    );
    
    console.log(`✅ Manual update: ${result.affectedRows} rows affected`);
    
    res.json({ 
      success: true, 
      message: `User ${userId} updated to ${newStatus}`,
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Manual update error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/* ================== TEST DIRECT SQL ================== */
app.post('/api/test-sql', async (req, res) => {
  const { sql, params } = req.body;
  
  console.log(`🧪 TEST SQL: ${sql}`);
  console.log(`🧪 Parameters:`, params);
  
  try {
    const [result] = await db.promise().query(sql, params || []);
    
    console.log(`✅ SQL Result:`, result);
    
    res.json({ 
      success: true, 
      result: result,
      message: 'SQL executed successfully'
    });
    
  } catch (error) {
    console.error('❌ SQL Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      sqlState: error.sqlState,
      code: error.code
    });
  }
});

/* ================== RESET DATABASE (DEVELOPMENT ONLY) ================== */
app.post('/api/reset-db', async (req, res) => {
  try {
    // Drop table if exists
    await db.promise().query('DROP TABLE IF EXISTS users');
    
    // Create table fresh
    const createTableSQL = `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status ENUM('pending', 'approve', 'rejected', 'reject') DEFAULT 'pending',
        role ENUM('admin', 'citizen', 'staff') DEFAULT 'citizen',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await db.promise().query(createTableSQL);
    
    // Insert sample data
    const insertSampleSQL = `
      INSERT INTO users (first_name, email, password, status, role) VALUES
      ('Admin User', 'admin@barangay.com', 'admin123', 'approve', 'admin'),
      ('Juan Dela Cruz', 'juan@email.com', 'password123', 'approve', 'citizen'),
      ('Maria Santos', 'maria@email.com', 'password123', 'pending', 'citizen'),
      ('Pedro Reyes', 'pedro@email.com', 'password123', 'rejected', 'citizen')
    `;
    
    const [insertResult] = await db.promise().query(insertSampleSQL);
    
    res.json({
      success: true,
      message: 'Database reset successfully',
      tablesCreated: ['users'],
      sampleDataInserted: insertResult.affectedRows
    });
  } catch (err) {
    console.error('❌ Reset database error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* ================== START SERVER ================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BACKEND SERVER STARTED SUCCESSFULLY!');
  console.log('📍 PORT:', PORT);
  console.log('🌐 Railway URL: https://unique-beauty.up.railway.app');
  console.log('📊 MySQL Host: metro.proxy.rlwy.net:49980');
  console.log('='.repeat(60));
  console.log('\n📋 AVAILABLE ENDPOINTS:');
  console.log('1.  GET  https://unique-beauty.up.railway.app/');
  console.log('2.  GET  https://unique-beauty.up.railway.app/api/debug-db');
  console.log('3.  GET  https://unique-beauty.up.railway.app/api/check-table');
  console.log('4.  POST https://unique-beauty.up.railway.app/api/create-users-table');
  console.log('5.  GET  https://unique-beauty.up.railway.app/api/pending-users');
  console.log('6.  POST https://unique-beauty.up.railway.app/api/approve-user');
  console.log('7.  POST https://unique-beauty.up.railway.app/api/reject-user');
  console.log('8.  POST https://unique-beauty.up.railway.app/citizen-login');
  console.log('9.  POST https://unique-beauty.up.railway.app/signup');
  console.log('10. POST https://unique-beauty.up.railway.app/admin-login');
  console.log('11. POST https://unique-beauty.up.railway.app/api/reset-db (DEV)');
  console.log('='.repeat(60));
  console.log('\n⚠️  IMPORTANT: Run /api/create-users-table first to create tables!');
  console.log('='.repeat(60));
});