// C:\Thesis\smart_barangay\smart_barangay_app\backend\index.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const app = express();

app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "smart_barangay"
});

// Connect to DB
db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.message);
    console.log("\nSOLUTION: Start MySQL service (XAMPP/WAMP)");
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database!");
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend server is running!" });
});

// Citizen Registration
app.post("/signup", (req, res) => {
  const { full_name, email, password } = req.body;
  console.log("Registration attempt:", { email });

  const sql = `INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)`;
  
  db.query(sql, [full_name, email, password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: "Email already exists" });
      }
      return res.status(500).json({ error: "Registration failed" });
    }
    
    res.json({ 
      message: "Registration successful - pending approval",
      userId: result.insertId 
    });
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});