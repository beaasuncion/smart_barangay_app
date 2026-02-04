const fetch = require('node-fetch');

async function testLogin() {
  console.log('Testing admin login...\n');
  
  try {
    const response = await fetch('http://localhost:5000/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@barangay.com',
        password: 'admin123'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Admin login successful!');
    } else {
      console.log('\n❌ Admin login failed:', data.error);
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
    console.log('\n💡 Make sure:');
    console.log('1. Backend server is running (node server.js)');
    console.log('2. Database has the admin user');
    console.log('3. MySQL is running');
  }
}

testLogin();