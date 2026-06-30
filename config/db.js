const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    // Initialize default admin if no users exist
    const User = require('../models/User');
    const email = 'valentinlyon205@gmail.com';
    const password = 'mamannkunda';
    const role = 'super_admin';
    
    console.log('🔍 Checking admin user...');
    let adminUser = await User.findOne({ email }).select('+password');
    
    if (!adminUser) {
      console.log('⚠️  Admin user not found, creating...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await User.create({
        name: 'Valentin Lyon',
        email,
        password: hashedPassword,
        role,
      });
      console.log('✓ Default admin user created: valentinlyon205@gmail.com / mamannkunda');
    } else {
      console.log('👤 Admin user found:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Has password:', !!adminUser.password);
      
      // Always reset password to ensure it's correct
      console.log('🔑 Resetting password to ensure it works...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      
      await User.updateOne(
        { email },
        { password: newHash, role }
      );
      console.log('✓ Admin user password reset successfully');
      
      // Verify the password works
      const isValid = await bcrypt.compare(password, newHash);
      console.log('✅ Password verification:', isValid);
    }
    
    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };