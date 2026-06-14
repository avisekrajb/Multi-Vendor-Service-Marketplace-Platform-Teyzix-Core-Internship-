import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'a@gmail.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'a@gmail.com',
      phone: '9800000000',
      password: '123456',
      role: 'admin',
      title: 'Platform Administrator',
      bio: 'System administrator for TEYZIX platform',
      isOnline: false,
      banned: false,
    });

    console.log('Admin user created successfully!');
    console.log('Email: a@gmail.com');
    console.log('Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();