import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import Request from '../models/Request.js';

// @desc    Create a review
// @route   POST /api/reviews
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment, requestId } = req.body;
  
  const request = await Request.findById(requestId);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  if (request.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the customer can review this project');
  }
  
  const existingReview = await Review.findOne({ requestId });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this project');
  }
  
  const review = await Review.create({
    customerId: req.user._id,
    providerId: request.providerId,
    serviceId: request.serviceId,
    requestId,
    rating,
    comment,
    author: req.user.name,
    date: new Date().toISOString().split('T')[0],
  });
  
  // Update service rating
  const service = await Service.findById(request.serviceId);
  if (service) {
    const serviceReviews = await Review.find({ serviceId: request.serviceId });
    const avgServiceRating = serviceReviews.reduce((a, b) => a + b.rating, 0) / serviceReviews.length;
    service.rating = avgServiceRating;
    service.reviewCount = serviceReviews.length;
    await service.save();
  }
  
  // Update provider rating
  const provider = await User.findById(request.providerId);
  if (provider) {
    const providerReviews = await Review.find({ providerId: request.providerId });
    const avgProviderRating = providerReviews.reduce((a, b) => a + b.rating, 0) / providerReviews.length;
    provider.rating = avgProviderRating;
    provider.totalReviews = providerReviews.length;
    await provider.save();
  }
  
  res.status(201).json(review);
});

// @desc    Get reviews for a provider
// @route   GET /api/reviews/provider/:providerId
export const getReviewsForProvider = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ providerId: req.params.providerId })
    .populate('customerId', 'name avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Get current user's reviews (my reviews)
// @route   GET /api/reviews/my-reviews
export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customerId: req.user._id })
    .populate('providerId', 'name avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// @desc    Get all reviews (public)
// @route   GET /api/reviews
export const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customerId', 'name avatar')
    .populate('providerId', 'name avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 })
    .limit(20);
  res.json(reviews);
});

// @desc    Get latest reviews for homepage
// @route   GET /api/reviews/latest
export const getLatestReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customerId', 'name avatar')
    .populate('providerId', 'name')
    .sort({ createdAt: -1 })
    .limit(6);
  res.json(reviews);
});

// @desc    Update review
// @route   PUT /api/reviews/:id
export const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 3600 * 24);
  if (daysSinceCreation > 7) {
    res.status(403);
    throw new Error('Reviews can only be edited within 7 days');
  }
  
  if (review.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  await review.save();
  
  // Recalculate ratings
  const service = await Service.findById(review.serviceId);
  if (service) {
    const serviceReviews = await Review.find({ serviceId: review.serviceId });
    service.rating = serviceReviews.reduce((a, b) => a + b.rating, 0) / serviceReviews.length;
    await service.save();
  }
  
  const provider = await User.findById(review.providerId);
  if (provider) {
    const providerReviews = await Review.find({ providerId: review.providerId });
    provider.rating = providerReviews.reduce((a, b) => a + b.rating, 0) / providerReviews.length;
    await provider.save();
  }
  
  res.json(review);
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  const daysSinceCreation = (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 3600 * 24);
  if (daysSinceCreation > 7 && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Reviews can only be deleted within 7 days');
  }
  
  if (review.customerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  await review.deleteOne();
  
  // Recalculate ratings
  const service = await Service.findById(review.serviceId);
  if (service) {
    const serviceReviews = await Review.find({ serviceId: review.serviceId });
    service.rating = serviceReviews.length > 0 
      ? serviceReviews.reduce((a, b) => a + b.rating, 0) / serviceReviews.length 
      : 0;
    service.reviewCount = serviceReviews.length;
    await service.save();
  }
  
  const provider = await User.findById(review.providerId);
  if (provider) {
    const providerReviews = await Review.find({ providerId: review.providerId });
    provider.rating = providerReviews.length > 0 
      ? providerReviews.reduce((a, b) => a + b.rating, 0) / providerReviews.length 
      : 0;
    provider.totalReviews = providerReviews.length;
    await provider.save();
  }
  
  res.json({ message: 'Review deleted' });
});

// @desc    Respond to review
// @route   POST /api/reviews/:id/respond
export const respondToReview = asyncHandler(async (req, res) => {
  const { response } = req.body;
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  
  if (review.providerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the provider can respond to reviews');
  }
  
  review.providerResponse = {
    text: response,
    date: new Date(),
  };
  await review.save();
  
  res.json(review);
});