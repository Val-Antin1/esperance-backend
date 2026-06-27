const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default admin if no users exist
    const User = require('../models/User');
    const existing = await User.countDocuments();
    
    if (existing === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('mamannkunda', salt);
      
      await User.create({
        name: 'Valentin Lyon',
        email: 'valentinlyon205@gmail.com',
        password: hashedPassword,
        role: 'super_admin',
      });
      console.log('✓ Default admin user created: valentinlyon205@gmail.com / mamannkunda');
    }
    
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };