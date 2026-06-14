import dotenv from 'dotenv';
import cloudinary from './src/config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function testFileUpload() {
  console.log('\n📤 TESTING FILE UPLOAD TO CLOUDINARY\n');
  
  // Create a simple test image as base64
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  try {
    // Upload from buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'teyzix/test_uploads',
          public_id: `test_${Date.now()}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(testImageBuffer);
    });
    
    console.log('✅ UPLOAD SUCCESSFUL!');
    console.log('----------------------------------------');
    console.log(`📷 Image URL: ${result.secure_url}`);
    console.log(`🆔 Public ID: ${result.public_id}`);
    console.log(`📁 Folder: ${result.folder}`);
    console.log(`📏 Size: ${result.bytes} bytes`);
    console.log(`🖼️ Format: ${result.format}`);
    console.log('----------------------------------------\n');
    
    // Clean up - delete test image
    await cloudinary.uploader.destroy(result.public_id);
    console.log('🧹 Test image deleted from Cloudinary\n');
    
    return true;
  } catch (error) {
    console.error('❌ UPLOAD FAILED!');
    console.error(`Error: ${error.message}`);
    console.error('\nPossible issues:');
    console.error('1. Check CLOUDINARY_CLOUD_NAME in .env');
    console.error('2. Check CLOUDINARY_API_KEY in .env');
    console.error('3. Check CLOUDINARY_API_SECRET in .env');
    console.error('4. Make sure you have internet connection');
    return false;
  }
}

// Also test if we can list existing images
async function listExistingImages() {
  console.log('\n📋 LISTING EXISTING IMAGES IN CLOUDINARY\n');
  
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'teyzix/',
      max_results: 10
    });
    
    if (result.resources && result.resources.length > 0) {
      console.log(`✅ Found ${result.resources.length} images in Cloudinary:`);
      result.resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.public_id}`);
        console.log(`      URL: ${resource.secure_url}`);
      });
    } else {
      console.log('📭 No images found in Cloudinary yet');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Failed to list images:', error.message);
  }
}

// Run tests
async function run() {
  console.log('========================================');
  console.log('🔧 CLOUDINARY UPLOAD TEST');
  console.log('========================================');
  
  const uploadSuccess = await testFileUpload();
  
  if (uploadSuccess) {
    await listExistingImages();
  }
  
  console.log('========================================');
  console.log('✨ Test complete!');
  console.log('========================================\n');
}

run();