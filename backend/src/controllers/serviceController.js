import asyncHandler from 'express-async-handler';
import Service from '../models/Service.js';
import cloudinary from '../config/cloudinary.js';

const SERVICE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Helper function for pagination
const paginate = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  return { skip, limit: limitNum, page: pageNum };
};

const paginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

// @desc    Get services for public (only approved)
// @route   GET /api/services
export const getServices = asyncHandler(async (req, res) => {
  const { skip, limit, page } = paginate(req.query.page, req.query.limit);
  const { category, search, minPrice, maxPrice, rating, sort } = req.query;
  
  const query = { status: SERVICE_STATUS.APPROVED };
  
  if (category && category !== 'All') {
    query.category = category;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseInt(minPrice);
    if (maxPrice) query.price.$lte = parseInt(maxPrice);
  }
  
  if (rating) {
    query.rating = { $gte: parseInt(rating) };
  }
  
  let sortOption = {};
  if (sort === 'price') sortOption.price = 1;
  else if (sort === 'price-desc') sortOption.price = -1;
  else if (sort === 'rating') sortOption.rating = -1;
  else sortOption.createdAt = -1;
  
  const services = await Service.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .populate('providerId', 'name avatar rating');
  
  const total = await Service.countDocuments(query);
  
  res.json(paginationResponse(services, total, page, limit));
});

// @desc    Get service by ID
// @route   GET /api/services/:id
export const getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('providerId', 'name avatar rating totalReviews bio skills title');
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  res.json(service);
});

// @desc    Get my services (provider) - FIXED VERSION
// @route   GET /api/services/my-services
export const getMyServices = asyncHandler(async (req, res) => {
  console.log('=== getMyServices called ===');
  console.log('User ID:', req.user?._id);
  console.log('User role:', req.user?.role);
  
  if (!req.user || !req.user._id) {
    console.error('No authenticated user');
    return res.status(401).json({ message: 'User not authenticated' });
  }
  
  // Find all services where providerId matches the logged-in user
  const services = await Service.find({ providerId: req.user._id })
    .sort({ createdAt: -1 });
  
  console.log(`Found ${services.length} services`);
  console.log('Services:', services.map(s => ({ id: s._id, title: s.title, status: s.status })));
  
  res.json(services);
});

// @desc    Create service
// @route   POST /api/services
export const createService = asyncHandler(async (req, res) => {
  const { title, category, price, delivery, description, icon } = req.body;
  
  console.log('Creating service for user:', req.user._id);
  
  let image = '';
  let imagePublicId = '';
  
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    image = result.secure_url;
    imagePublicId = result.public_id;
  }
  
  const service = await Service.create({
    providerId: req.user._id,
    title,
    category,
    price: Number(price),
    delivery: delivery || '7 days',
    description,
    icon: icon || '💻',
    image,
    imagePublicId,
    status: SERVICE_STATUS.PENDING,
  });
  
  console.log('Service created:', service._id);
  res.status(201).json(service);
});

// @desc    Update service
// @route   PUT /api/services/:id
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  const { title, category, price, delivery, description, icon } = req.body;
  
  if (req.file) {
    if (service.imagePublicId) {
      await cloudinary.uploader.destroy(service.imagePublicId);
    }
    const result = await cloudinary.uploader.upload(req.file.path);
    service.image = result.secure_url;
    service.imagePublicId = result.public_id;
  }
  
  if (title) service.title = title;
  if (category) service.category = category;
  if (price) service.price = Number(price);
  if (delivery) service.delivery = delivery;
  if (description) service.description = description;
  if (icon) service.icon = icon;
  
  await service.save();
  res.json(service);
});

// @desc    Delete service
// @route   DELETE /api/services/:id
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  if (service.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  if (service.imagePublicId) {
    await cloudinary.uploader.destroy(service.imagePublicId);
  }
  
  await service.deleteOne();
  res.json({ message: 'Service deleted' });
});

// @desc    Approve service (admin only)
// @route   PUT /api/services/:id/approve
export const approveService = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  service.status = SERVICE_STATUS.APPROVED;
  await service.save();
  
  res.json({ message: 'Service approved successfully', service });
});

// @desc    Reject service (admin only)
// @route   PUT /api/services/:id/reject
export const rejectService = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  service.status = SERVICE_STATUS.REJECTED;
  await service.save();
  
  res.json({ message: 'Service rejected', service });
});

// @desc    Get all services for admin
// @route   GET /api/services/admin/all
export const getAllServicesForAdmin = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const services = await Service.find({})
    .populate('providerId', 'name email avatar')
    .sort({ createdAt: -1 });
  
  res.json(services);
});


// Add this function to your serviceController.js

// @desc    Get services by provider ID
// @route   GET /api/services/provider/:providerId
export const getServicesByProvider = asyncHandler(async (req, res) => {
  const services = await Service.find({ 
    providerId: req.params.providerId,
    status: { $in: ['approved', 'pending'] } // Show approved and pending services
  }).populate('providerId', 'name avatar rating');
  
  res.json(services);
});