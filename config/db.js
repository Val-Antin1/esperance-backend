const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    
    const User = require('../models/User');
    const adminUsers = [
      { name: 'Super Admin', email: 'domyserry@yahoo.fr', password: 'esperance1996.', role: 'super_admin' },
      { name: 'Valentin Lyon', email: 'valentinlyon205@gmail.com', password: 'mamannkunda', role: 'super_admin' },
    ];

    for (const admin of adminUsers) {
      console.log(`🔍 Checking admin user ${admin.email}...`);
      let user = await User.findOne({ email: admin.email }).select('+password');
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      if (!user) {
        console.log(`⚠️  Admin user not found, creating ${admin.email}...`);
        await User.create({
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          role: admin.role,
        });
        console.log(`✓ Default admin user created: ${admin.email} / ${admin.password}`);
      } else {
        console.log('👤 Admin user found:', user.email);
        console.log('   Role:', user.role);
        console.log('   Has password:', !!user.password);

        if (user.role !== admin.role || !(await bcrypt.compare(admin.password, user.password))) {
          console.log(`🔑 Updating admin user ${admin.email} to ensure correct role and password...`);
          await User.updateOne({ email: admin.email }, { password: hashedPassword, role: admin.role });
          console.log(`✓ Admin user updated: ${admin.email}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = { connectDB };