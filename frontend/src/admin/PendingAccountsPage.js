// src/admin/PendingAccountsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PendingAccountsPage.css";
import bg from "../assets/bg.jpg";
import BurgerMenu from "../components/BurgerMenu";

// API URL Configuration
const API_URL = "http://localhost:5000";

export default function PendingAccountsPage() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => {
    const storedUser = localStorage.getItem("currentUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0
  });

  // Fetch pending users from database
  const fetchPendingUsers = async () => {
    setLoading(true);
    setError(null);
    console.log("🔄 Fetching pending users from database...");
    
    try {
      console.log(`📡 Calling API: ${API_URL}/api/pending-users`);
      const response = await fetch(`${API_URL}/api/pending-users`, {
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      console.log("📥 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch pending users`);
      }
      
      const data = await response.json();
      console.log("📊 API response:", data);
      
      if (data.success) {
        console.log(`✅ Found ${data.users?.length || 0} pending users`);
        setPendingUsers(data.users || []);
        
        // Calculate statistics
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        
        const users = data.users || [];
        const statsData = {
          total: users.length,
          today: users.filter(user => {
            if (!user.created_at) return false;
            const userDate = new Date(user.created_at).toISOString().split('T')[0];
            return userDate === todayStr;
          }).length,
          thisWeek: users.filter(user => {
            if (!user.created_at) return false;
            const userDate = new Date(user.created_at);
            return userDate >= oneWeekAgo;
          }).length
        };
        
        setStats(statsData);
      } else {
        const errorMsg = data.error || "Failed to fetch pending users";
        console.error("❌ API error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("❌ Network/API error:", err);
      setError(err.message);
      
      // NO MOCK DATA - just show error
      setPendingUsers([]);
      setStats({
        total: 0,
        today: 0,
        thisWeek: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Get user full name
  const getUserFullName = (user) => {
    if (!user) return "No User Data";
    
    const firstName = user.first_name || user.firstname || user.fname || '';
    const lastName = user.last_name || user.lastname || user.lname || '';
    const fullName = user.name || user.full_name || user.fullname || '';
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) {
      return firstName;
    }
    if (lastName) {
      return lastName;
    }
    if (fullName) {
      return fullName;
    }
    if (user.email) {
      const emailName = user.email.split('@')[0];
      return emailName.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    if (user.id) {
      return `User ${user.id}`;
    }
    
    return "Unknown User";
  };

  // Get user email
  const getUserEmail = (user) => {
    return user.email || user.email_address || "No Email";
  };

  // Get user phone
  const getUserPhone = (user) => {
    return user.phone || user.phone_number || user.mobile || user.contact || "No Phone";
  };

  // Approve user - FIXED VERSION
  const handleApprove = async (userId) => {
    if (!window.confirm("Are you sure you want to approve this user?")) {
      return;
    }
    
    setProcessing(prev => ({ ...prev, [userId]: 'approving' }));
    
    try {
      console.log(`✅ Approving user ID: ${userId}`);
      
      const response = await fetch(`${API_URL}/api/approve-user`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          userId: userId
        })
      });
      
      console.log("📥 Response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("📊 Response data:", data);
      } catch (parseErr) {
        console.error("❌ Failed to parse JSON");
        throw new Error("Server returned invalid JSON");
      }
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message || 'User approved successfully!'}`);
        
        // Remove the approved user from the list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        
        // Refresh the list to get updated data
        setTimeout(() => {
          fetchPendingUsers();
        }, 500);
        
      } else {
        const errorMsg = data.error || data.message || `HTTP ${response.status}`;
        console.error("❌ Server error:", errorMsg);
        alert(`❌ Failed to approve user: ${errorMsg}`);
      }
      
    } catch (err) {
      console.error("❌ Approve error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        alert("❌ Cannot connect to backend server!");
      } else {
        alert(`❌ Error: ${err.message}`);
      }
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: null }));
    }
  };

  // Reject user - FIXED VERSION
  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this user?")) {
      return;
    }
    
    setProcessing(prev => ({ ...prev, [userId]: 'rejecting' }));
    
    try {
      console.log(`❌ Rejecting user ID: ${userId}`);
      
      const response = await fetch(`${API_URL}/api/reject-user`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          userId: userId
        })
      });
      
      console.log("📥 Response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("📊 Response data:", data);
      } catch (parseErr) {
        console.error("❌ Failed to parse JSON");
        throw new Error("Server returned invalid JSON");
      }
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message || 'User rejected successfully!'}`);
        
        // Remove the rejected user from the list
        setPendingUsers(prev => prev.filter(user => user.id !== userId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        
        // Refresh the list to get updated data
        setTimeout(() => {
          fetchPendingUsers();
        }, 500);
        
      } else {
        const errorMsg = data.error || data.message || `HTTP ${response.status}`;
        console.error("❌ Server error:", errorMsg);
        alert(`❌ Failed to reject user: ${errorMsg}`);
      }
      
    } catch (err) {
      console.error("❌ Reject error:", err);
      
      if (err.message.includes("Failed to fetch")) {
        alert("❌ Cannot connect to backend server!");
      } else {
        alert(`❌ Error: ${err.message}`);
      }
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: null }));
    }
  };

  // Export to CSV
  const handleExport = () => {
    if (pendingUsers.length === 0) {
      alert("No pending users to export.");
      return;
    }

    const headers = ["ID", "Name", "Email", "Phone", "Address", "Status", "Date Registered"];
    const csvData = pendingUsers.map(user => [
      user.id,
      getUserFullName(user),
      getUserEmail(user),
      getUserPhone(user),
      user.address || "N/A",
      user.status || "pending",
      new Date(user.created_at || Date.now()).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    alert(`📥 Exported ${pendingUsers.length} pending users to CSV.`);
  };

  // View user details
  const handleViewDetails = (user) => {
    const details = `
      👤 USER DETAILS:
      ================
      ID: ${user.id || "N/A"}
      Name: ${getUserFullName(user)}
      Email: ${getUserEmail(user)}
      Phone: ${getUserPhone(user)}
      Address: ${user.address || 'Not provided'}
      Status: ${user.status || 'pending'}
      Registered: ${new Date(user.created_at || Date.now()).toLocaleString()}
    `;
    alert(details);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Calculate how long ago
  const timeAgo = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    } catch (e) {
      return "Recently";
    }
  };

  // Test backend connection
  const testBackend = async () => {
    try {
      console.log("🔍 Testing backend connection...");
      const response = await fetch(`${API_URL}/`);
      const data = await response.json();
      console.log("✅ Backend status:", data);
      alert(`✅ Backend is running!\n\n${data.message}\nPort: ${data.port}`);
    } catch (err) {
      console.error("❌ Backend test failed:", err);
      alert("❌ Cannot connect to backend!\n\nMake sure backend is running.");
    }
  };

  // Test database connection
  const testDatabase = async () => {
    try {
      console.log("🔍 Testing database connection...");
      const response = await fetch(`${API_URL}/debug-users`);
      const data = await response.json();
      console.log("✅ Database status:", data);
      alert(`✅ Database connection successful!\n\nTotal users: ${data.count}`);
    } catch (err) {
      console.error("❌ Database test failed:", err);
      alert("❌ Cannot connect to database!");
    }
  };

  // Initialize
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser) {
      navigate("/admin-login");
      return;
    }

    fetchPendingUsers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingUsers, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div 
      className="pending-accounts-container" 
      style={{ 
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="background-overlay" />
      
      {/* Burger menu */}
      {currentUser && <BurgerMenu currentUser={currentUser} />}

      <div className="content-wrapper">
        <div className="pending-panel">
          {/* Header with stats */}
          <div className="pending-header">
            <h1>📋 Pending Citizen Accounts</h1>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-label">Total Pending</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today</span>
                <span className="stat-value">{stats.today}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">This Week</span>
                <span className="stat-value">{stats.thisWeek}</span>
              </div>
            </div>
          </div>

          {/* Control buttons */}
          <div className="control-buttons">
            <button 
              className="back-btn" 
              onClick={() => navigate("/admin-home")}
            >
              ← Back to Dashboard
            </button>
            <div className="right-controls">
              <button 
                className="refresh-btn"
                onClick={fetchPendingUsers}
                disabled={loading}
                title="Refresh list"
              >
                {loading ? "🔄 Refreshing..." : "🔄 Refresh"}
              </button>
              <button 
                className="export-btn"
                onClick={handleExport}
                disabled={pendingUsers.length === 0 || loading}
                title="Export to CSV"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {/* Debug buttons */}
          <div className="debug-buttons" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={testBackend}
              style={{
                padding: '6px 12px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ✅ Test Backend
            </button>
            <button 
              onClick={testDatabase}
              style={{
                padding: '6px 12px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🗄️ Test Database
            </button>
            <button 
              onClick={() => {
                console.log("🔍 Current state:", { pendingUsers, processing, stats });
                alert(`State logged to console\n\nUsers: ${pendingUsers.length}\nProcessing: ${Object.keys(processing).length}`);
              }}
              style={{
                padding: '6px 12px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🐛 Debug State
            </button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading pending accounts from database...</p>
              <p><small>Fetching data from: {API_URL}/api/pending-users</small></p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>Error Loading Data</h3>
              <p>{error}</p>
              <div style={{ marginTop: '15px' }}>
                <button className="refresh-btn" onClick={fetchPendingUsers}>
                  Try Again
                </button>
                <button 
                  className="back-btn" 
                  onClick={() => navigate("/admin-home")}
                  style={{ marginLeft: '10px' }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && pendingUsers.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>All Caught Up!</h3>
              <p>No pending accounts in the database.</p>
              <div className="empty-actions">
                <button className="refresh-btn" onClick={fetchPendingUsers}>
                  Check Again
                </button>
                <button className="back-btn" onClick={() => navigate("/admin-home")}>
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {/* Table - Only show if we have data */}
          {!loading && !error && pendingUsers.length > 0 && (
            <>
              <div className="table-info">
                <p>Showing <strong>{pendingUsers.length}</strong> pending account{pendingUsers.length !== 1 ? 's' : ''}</p>
                <small>Last updated: {new Date().toLocaleTimeString()}</small>
              </div>
              
              <div className="pending-table-container">
                <table className="pending-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Citizen Information</th>
                      <th>Contact Details</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user, index) => (
                      <tr 
                        key={user.id || index} 
                        className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                      >
                        <td className="user-number">
                          <div className="user-index">{index + 1}</div>
                          <div style={{fontSize: "10px", color: "#6c757d"}}>ID: {user.id}</div>
                        </td>
                        <td>
                          <div className="user-info">
                            <div className="user-name-row">
                              <span className="user-name">
                                {getUserFullName(user)}
                              </span>
                              <span className="status-badge pending">
                                {(user.status || "pending").toUpperCase()}
                              </span>
                            </div>
                            {user.address && (
                              <div className="user-details">
                                <span className="user-address">📍 {user.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="contact-cell">
                          <div className="contact-info">
                            <div className="user-email" title={getUserEmail(user)}>
                              ✉️ {getUserEmail(user)}
                            </div>
                            <div className="user-phone">
                              📱 {getUserPhone(user)}
                            </div>
                          </div>
                        </td>
                        <td className="date-cell">
                          <div className="date-info">
                            <div className="date-formatted">
                              {formatDate(user.created_at || user.registration_date)}
                            </div>
                            <div className="time-ago">
                              ({timeAgo(user.created_at || user.registration_date)})
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="table-approve-btn"
                              onClick={() => handleApprove(user.id)}
                              disabled={processing[user.id]}
                              title="Approve this user"
                            >
                              {processing[user.id] === 'approving' ? (
                                <span className="processing">⏳</span>
                              ) : '✅ Approve'}
                            </button>
                            <button
                              className="table-reject-btn"
                              onClick={() => handleReject(user.id)}
                              disabled={processing[user.id]}
                              title="Reject this user"
                            >
                              {processing[user.id] === 'rejecting' ? (
                                <span className="processing">⏳</span>
                              ) : '❌ Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="table-footer">
                <p className="footer-note">
                  💡 <strong>Note:</strong> Click "Refresh" to get latest data from database
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}