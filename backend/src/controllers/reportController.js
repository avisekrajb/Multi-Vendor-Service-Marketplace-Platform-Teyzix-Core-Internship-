import asyncHandler from 'express-async-handler';
import { Parser } from 'json2csv';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';
import Dispute from '../models/Dispute.js';

// @desc    Generate report
// @route   POST /api/reports/generate
export const generateReport = asyncHandler(async (req, res) => {
  const { type, filters } = req.body;
  let data = [];
  let reportData = {};
  
  try {
    switch (type) {
      case 'users':
        const usersQuery = {};
        if (filters?.role && filters.role !== 'all') usersQuery.role = filters.role;
        if (filters?.status === 'banned') usersQuery.banned = true;
        if (filters?.status === 'active') usersQuery.banned = false;
        
        const users = await User.find(usersQuery).select('-password -refreshToken');
        data = users.map(u => ({
          'Name': u.name,
          'Email': u.email,
          'Phone': u.phone,
          'Role': u.role,
          'Status': u.banned ? 'Banned' : 'Active',
          'Joined': new Date(u.createdAt).toLocaleDateString(),
          'Completed Projects': u.completedProjects || 0,
          'Rating': u.rating?.toFixed(1) || '0.0'
        }));
        reportData = { type, count: data.length, data, generatedAt: new Date() };
        break;
        
      case 'services':
        const servicesQuery = {};
        if (filters?.status && filters.status !== 'all') servicesQuery.status = filters.status;
        
        const services = await Service.find(servicesQuery).populate('providerId', 'name');
        data = services.map(s => ({
          'Title': s.title,
          'Category': s.category,
          'Price': s.price,
          'Delivery': s.delivery,
          'Provider': s.providerId?.name || 'Unknown',
          'Status': s.status,
          'Rating': s.rating?.toFixed(1) || '0.0',
          'Reviews': s.reviewCount || 0,
          'Created': new Date(s.createdAt).toLocaleDateString()
        }));
        reportData = { type, count: data.length, data, generatedAt: new Date() };
        break;
        
      case 'requests':
        const requestsQuery = {};
        if (filters?.status && filters.status !== 'all') requestsQuery.status = filters.status;
        
        const requests = await Request.find(requestsQuery)
          .populate('customerId', 'name')
          .populate('providerId', 'name');
        data = requests.map(r => ({
          'Title': r.title,
          'Customer': r.customerId?.name || 'Unknown',
          'Provider': r.providerId?.name || 'Unknown',
          'Budget': r.budget,
          'Status': r.status,
          'Deadline': r.deadline,
          'Created': r.created,
          'Progress': `${r.progress}%`
        }));
        reportData = { type, count: data.length, data, generatedAt: new Date() };
        break;
        
      case 'reviews':
        const reviews = await Review.find()
          .populate('customerId', 'name')
          .populate('providerId', 'name')
          .populate('serviceId', 'title');
        data = reviews.map(r => ({
          'Author': r.author,
          'Provider': r.providerId?.name || 'Unknown',
          'Service': r.serviceId?.title || 'Unknown',
          'Rating': r.rating,
          'Comment': r.comment,
          'Date': r.date,
          'Provider Response': r.providerResponse?.text || 'No response'
        }));
        reportData = { type, count: data.length, data, generatedAt: new Date() };
        break;
        
      case 'revenue':
        const deliveredRequests = await Request.find({ status: 'Delivered' });
        const totalRevenue = deliveredRequests.reduce((sum, r) => sum + (r.budget || 0), 0);
        const platformCommission = totalRevenue * 0.1;
        
        // Monthly revenue data for chart
        const monthlyRevenue = await Request.aggregate([
          { $match: { status: 'Delivered' } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              total: { $sum: '$budget' }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ]);
        
        reportData = {
          type,
          totalRevenue,
          platformCommission,
          projectCount: deliveredRequests.length,
          averageProjectValue: deliveredRequests.length ? totalRevenue / deliveredRequests.length : 0,
          monthlyRevenue: monthlyRevenue.map(m => ({
            month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
            revenue: m.total
          })),
          generatedAt: new Date()
        };
        break;
        
      case 'disputes':
        const disputesQuery = {};
        if (filters?.status && filters.status !== 'all') disputesQuery.status = filters.status;
        
        const disputes = await Dispute.find(disputesQuery)
          .populate('requestId', 'title')
          .populate('raisedBy', 'name');
        data = disputes.map(d => ({
          'Project': d.requestId?.title || 'Unknown',
          'Raised By': d.raisedBy?.name || 'Unknown',
          'Reason': d.reason,
          'Description': d.description,
          'Status': d.status,
          'Resolution': d.resolution || 'Pending',
          'Created': new Date(d.createdAt).toLocaleDateString(),
          'Resolved': d.adminResponse?.resolvedAt ? new Date(d.adminResponse.resolvedAt).toLocaleDateString() : 'Not yet'
        }));
        reportData = { type, count: data.length, data, generatedAt: new Date() };
        break;
        
      default:
        reportData = { type, message: 'No data available', generatedAt: new Date() };
    }
    
    // Save report to database (without format field)
    const report = await Report.create({
      generatedBy: req.user._id,
      type,
      format: 'csv', // default format
      filters: filters || {},
      data: reportData,
      generatedAt: new Date()
    });
    
    res.json({ 
      success: true,
      message: 'Report generated successfully', 
      reportId: report._id,
      data: reportData 
    });
    
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to generate report' 
    });
  }
});

// @desc    Get all reports
// @route   GET /api/reports
export const getReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('generatedBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(reports);
});

// @desc    Download report as CSV with watermark
// @route   GET /api/reports/:id/download/csv
export const downloadCSV = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('generatedBy', 'name email');
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }
  
  const { data } = report.data;
  if (!data || data.length === 0) {
    res.status(400);
    throw new Error('No data to export');
  }
  
  // Add watermark info to CSV
  const watermark = `# TEYZIX Platform Report
# Generated By: ${report.generatedBy?.name || 'Admin'}
# Generated At: ${new Date().toLocaleString()}
# Report Type: ${report.type.toUpperCase()}
# Total Records: ${data.length}
${'='.repeat(60)}
`;
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const footer = `\n${'='.repeat(60)}
# End of Report
# © TEYZIX Marketplace - All Rights Reserved
# Generated on: ${new Date().toLocaleString()}`;
  
  const csvContent = watermark + csvRows.join('\n') + footer;
  
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=TEYZIX_${report.type}_report_${new Date().toISOString().split('T')[0]}.csv`);
  res.send(csvContent);
});

// @desc    Download report as JSON with watermark
// @route   GET /api/reports/:id/download/json
export const downloadJSON = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id).populate('generatedBy', 'name email');
  if (!report) {
    res.status(404);
    throw new Error('Report not found');
  }
  
  const jsonData = {
    watermark: {
      platform: 'TEYZIX Marketplace',
      version: '1.0.0',
      generatedBy: report.generatedBy?.name || 'Admin',
      generatedByEmail: report.generatedBy?.email || 'admin@teyzix.com',
      generatedAt: new Date().toISOString(),
      reportType: report.type,
      reportId: report._id,
      totalRecords: report.data.data?.length || 0,
      copyright: '© TEYZIX - All Rights Reserved'
    },
    logo: {
      name: 'TEYZIX',
      tagline: "Nepal's #1 Service Marketplace",
      website: 'https://teyzix.com'
    },
    reportData: report.data,
    footer: {
      message: 'This report is confidential and generated by TEYZIX platform',
      support: 'For questions, contact support@teyzix.com',
      generatedOn: new Date().toLocaleString()
    }
  };
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=TEYZIX_${report.type}_report_${new Date().toISOString().split('T')[0]}.json`);
  res.json(jsonData);
});