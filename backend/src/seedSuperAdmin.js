import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import SuperAdmin from './models/SuperAdmin.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check if super admin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({ email: 'superadmin999@gmail.com' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      console.log('Email: superadmin999@gmail.com');
      console.log('Password: 123456');
      process.exit(0);
    }
    
    // Create super admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    await SuperAdmin.create({
      name: 'Super Admin',
      email: 'superadmin999@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
    });
    
    console.log('✅ Super Admin created successfully!');
    console.log('📧 Email: superadmin999@gmail.com');
    console.log('🔑 Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
};

seedSuperAdmin();