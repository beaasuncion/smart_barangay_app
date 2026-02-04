const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

/* ================== MYSQL CONNECTION (POOL) ================== */
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Barangay123!",
  database: "smart_barangay",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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
    port: 5000,
    time: new Date().toLocaleString()
  });
});

/* ================== DEBUG DATABASE ================== */
app.get('/api/debug-db', async (req, res) => {
  try {
    // Test connection
    const [test] = await db.promise().query('SELECT 1 as test');
    
    // Get all users
    const [users] = await db.promise().query(
      'SELECT id, first_name, email, status FROM users ORDER BY id DESC'
    );
    
    res.json({
      success: true,
      dbConnected: true,
      testResult: test[0].test,
      totalUsers: users.length,
      users: users,
      message: 'Database connection successful'
    });
  } catch (err) {
    console.error('❌ Database debug error:', err);
    res.status(500).json({
      success: false,
      dbConnected: false,
      error: err.message
    });
  }
});

/* ================== CHECK TABLE STRUCTURE ================== */
app.get('/api/check-table', async (req, res) => {
  try {
    // Check users table structure
    const [structure] = await db.promise().query('DESCRIBE users');
    
    // Check all status values
    const [statusValues] = await db.promise().query(
      'SELECT DISTINCT status, COUNT(*) as count FROM users GROUP BY status'
    );
    
    res.json({
      success: true,
      tableStructure: structure,
      statusValues: statusValues,
      message: 'Table check successful'
    });
  } catch (err) {
    console.error('❌ Table check error:', err);
    res.status(500).json({
      success: false,
      error: err.message
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

/* ================== START SERVER ================== */
const PORT = 5000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BACKEND SERVER STARTED SUCCESSFULLY!');
  console.log('📍 LOCAL:  http://localhost:' + PORT);
  console.log('📡 Frontend should run on http://localhost:3000');
  console.log('='.repeat(60));
  console.log('\n📋 AVAILABLE ENDPOINTS:');
  console.log('1. GET  http://localhost:' + PORT + '/');
  console.log('2. GET  http://localhost:' + PORT + '/debug-users');
  console.log('3. GET  http://localhost:' + PORT + '/api/debug-db');
  console.log('4. GET  http://localhost:' + PORT + '/api/check-table');
  console.log('5. GET  http://localhost:' + PORT + '/api/pending-users');
  console.log('6. POST http://localhost:' + PORT + '/api/approve-user');
  console.log('7. POST http://localhost:' + PORT + '/api/reject-user');
  console.log('8. POST http://localhost:' + PORT + '/api/update-status');
  console.log('9. POST http://localhost:' + PORT + '/api/test-sql');
  console.log('='.repeat(60));
});