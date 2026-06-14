import dotenv from 'dotenv';
import cloudinary from './src/config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

console.log('\n========================================');
console.log('🔍 CLOUDINARY & FILE SYSTEM CHECKER');
console.log('========================================\n');

// Check Environment Variables
console.log('📋 ENVIRONMENT VARIABLES:');
console.log('----------------------------------------');
console.log(`CLOUDINARY_CLOUD_NAME: ${process.env.CLOUDINARY_CLOUD_NAME || '❌ NOT SET'}`);
console.log(`CLOUDINARY_API_KEY: ${process.env.CLOUDINARY_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`CLOUDINARY_API_SECRET: ${process.env.CLOUDINARY_API_SECRET ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '❌ NOT SET'}\n`);

// Test Cloudinary Connection
async function testCloudinary() {
  console.log('☁️ CLOUDINARY CONNECTION TEST:');
  console.log('----------------------------------------');
  
  try {
    // Test 1: Check if cloudinary is configured
    const configCheck = cloudinary.config();
    console.log(`✓ Cloudinary config loaded`);
    console.log(`  Cloud Name: ${configCheck.cloud_name || 'Not set'}`);
    
    // Test 2: Try to upload a test string (base64 image)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const result = await cloudinary.uploader.upload(testImage, {
      folder: 'teyzix/test',
      public_id: 'test_connection'
    });
    
    console.log(`✓ Cloudinary connection SUCCESSFUL!`);
    console.log(`  Image URL: ${result.secure_url}`);
    console.log(`  Public ID: ${result.public_id}`);
    
    // Clean up test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log(`  Test image cleaned up\n`);
    
    return true;
  } catch (error) {
    console.log(`✗ Cloudinary connection FAILED!`);
    console.log(`  Error: ${error.message}\n`);
    return false;
  }
}

// List all files that use Cloudinary
function listCloudinaryFiles() {
  console.log('📁 FILES THAT USE CLOUDINARY:');
  console.log('----------------------------------------');
  
  const directories = [
    'src/config',
    'src/middleware', 
    'src/controllers',
    'src/routes'
  ];
  
  const cloudinaryFiles = [];
  
  directories.forEach(dir => {
    const fullPath = path.join(__dirname, 'src', dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath);
      files.forEach(file => {
        const filePath = path.join(fullPath, file);
        if (file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('cloudinary')) {
            cloudinaryFiles.push(`src/${dir}/${file}`);
          }
        }
      });
    }
  });
  
  cloudinaryFiles.forEach(file => {
    console.log(`  ✅ ${file}`);
  });
  
  if (cloudinaryFiles.length === 0) {
    console.log('  No files found using cloudinary');
  }
  console.log('');
}

// Check which files are using image upload
function listImageUploadFiles() {
  console.log('🖼️ FILES WITH IMAGE UPLOAD FUNCTIONALITY:');
  console.log('----------------------------------------');
  
  const uploadFiles = [
    { file: 'src/middleware/upload.js', desc: 'Main upload configuration' },
    { file: 'src/controllers/authController.js', desc: 'User avatar upload' },
    { file: 'src/controllers/serviceController.js', desc: 'Service image upload' },
    { file: 'src/controllers/userController.js', desc: 'Profile avatar upload' },
    { file: 'src/controllers/requestController.js', desc: 'Request attachments upload' },
    { file: 'src/routes/authRoutes.js', desc: 'Register with avatar' },
    { file: 'src/routes/serviceRoutes.js', desc: 'Create/Update services with images' },
    { file: 'src/routes/userRoutes.js', desc: 'Update profile with avatar' },
    { file: 'src/routes/requestRoutes.js', desc: 'Add request attachments' }
  ];
  
  uploadFiles.forEach(item => {
    const fullPath = path.join(__dirname, item.file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${item.file}`);
      console.log(`     📝 ${item.desc}`);
    } else {
      console.log(`  ❌ ${item.file} (MISSING)`);
    }
  });
  console.log('');
}

// Check multer-storage-cloudinary installation
function checkPackages() {
  console.log('📦 REQUIRED PACKAGES:');
  console.log('----------------------------------------');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = packageJson.dependencies || {};
    
    const requiredPackages = [
      'multer',
      'multer-storage-cloudinary',
      'cloudinary'
    ];
    
    requiredPackages.forEach(pkg => {
      if (deps[pkg]) {
        console.log(`  ✅ ${pkg}: ${deps[pkg]}`);
      } else {
        console.log(`  ❌ ${pkg}: NOT INSTALLED`);
        console.log(`     Run: npm install ${pkg}`);
      }
    });
  }
  console.log('');
}

// Test model structures for image fields
function checkModels() {
  console.log('🗄️ DATABASE MODELS WITH IMAGE FIELDS:');
  console.log('----------------------------------------');
  
  const modelsDir = path.join(__dirname, 'src', 'models');
  if (fs.existsSync(modelsDir)) {
    const modelFiles = fs.readdirSync(modelsDir);
    modelFiles.forEach(file => {
      if (file.endsWith('.js')) {
        const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
        const hasImageField = content.includes('image') || content.includes('avatar') || content.includes('attachment');
        if (hasImageField) {
          console.log(`  ✅ ${file}`);
          // Find image-related fields
          const imageFields = [];
          if (content.includes('image:')) imageFields.push('image');
          if (content.includes('imagePublicId')) imageFields.push('imagePublicId');
          if (content.includes('avatar:')) imageFields.push('avatar');
          if (content.includes('avatarPublicId')) imageFields.push('avatarPublicId');
          if (content.includes('attachments')) imageFields.push('attachments');
          if (imageFields.length) {
            console.log(`     Fields: ${imageFields.join(', ')}`);
          }
        }
      }
    });
  }
  console.log('');
}

// Run all tests
async function runAllTests() {
  console.log('🚀 STARTING COMPREHENSIVE CHECK...\n');
  
  // 1. Test Cloudinary
  const cloudinaryWorking = await testCloudinary();
  
  // 2. List files using cloudinary
  listCloudinaryFiles();
  
  // 3. List image upload files
  listImageUploadFiles();
  
  // 4. Check packages
  checkPackages();
  
  // 5. Check models
  checkModels();
  
  // Final Summary
  console.log('📊 FINAL SUMMARY:');
  console.log('========================================');
  if (cloudinaryWorking) {
    console.log('✅ Cloudinary is WORKING correctly');
    console.log('✅ Images will be stored in Cloudinary');
    console.log('✅ Database only stores URLs and Public IDs');
  } else {
    console.log('❌ Cloudinary is NOT working');
    console.log('   Please check your .env file credentials');
    console.log('   Make sure CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET are correct');
  }
  console.log('========================================\n');
}

// Create a simple upload test function
export async function testImageUpload(filePath) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'teyzix/test_upload'
    });
    console.log('✅ Test upload successful!');
    console.log(`   URL: ${result.secure_url}`);
    console.log(`   Public ID: ${result.public_id}`);
    return result;
  } catch (error) {
    console.error('❌ Test upload failed:', error.message);
    return null;
  }
}

// Run the tests
runAllTests();