require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@mint.gov.et' });

    if (existingAdmin) {
      console.log('Admin already exists:');
      console.log({
        email: existingAdmin.email,
        role: existingAdmin.role,
        fullName: existingAdmin.fullName,
      });
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      fullName: 'MinT Administrator',
      email: 'admin@mint.gov.et',
      password: 'Admin@123456',   // Change this later
      role: 'admin',
    });

    console.log('✅ Admin created successfully!');
    console.log({
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role,
    });
    console.log('\nLogin credentials:');
    console.log('Email:    admin@mint.gov.et');
    console.log('Password: Admin@123456');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();