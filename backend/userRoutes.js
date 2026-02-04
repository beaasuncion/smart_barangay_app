// server.js or routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Change password endpoint
router.put('/api/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // 1. Hanapin ang user sa database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 2. I-verify ang current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // 3. Hash ang bagong password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 4. I-update ang password sa database
    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});