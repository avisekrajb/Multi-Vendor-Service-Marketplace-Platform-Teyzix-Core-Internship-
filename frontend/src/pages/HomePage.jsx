import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ServiceCard from '../components/Service/ServiceCard';
import Stars from '../components/Common/Stars';
import Avatar from '../components/Common/Avatar';
import { getServices, getLatestReviews } from '../services/api';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredServices, setFeaturedServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, reviewsRes] = await Promise.all([
          getServices({ page: 1, limit: 6 }),
          getLatestReviews()
        ]);
        setFeaturedServices(servicesRes.data?.data || servicesRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Client testimonials - Mock data
  const clientTestimonials = [
    {
      id: 1,
      name: "Rajesh Sharma",
      role: "Founder, TechNepal",
      avatar: null,
      rating: 5,
      comment: "TEYZIX helped us find the perfect web developer for our e-commerce platform. The quality of work was exceptional and delivered before deadline. Highly recommended!",
      date: "2024-03-15"
    },
    {
      id: 2,
      name: "Priya Gurung",
      role: "Marketing Director",
      avatar: null,
      rating: 5,
      comment: "The logo design service exceeded our expectations. The designer understood our brand vision perfectly and delivered multiple concepts. Will definitely use again!",
      date: "2024-03-10"
    },
    {
      id: 3,
      name: "Sujan Thapa",
      role: "Business Owner",
      avatar: null,
      rating: 5,
      comment: "Outstanding platform! Found a content writer who transformed our website traffic. The escrow payment system gives peace of mind. Best marketplace in Nepal!",
      date: "2024-03-05"
    }
  ];

  // Statistics data
  const stats = [
    { number: '500+', label: 'Service Providers' },
    { number: '2,000+', label: 'Projects Done' },
    { number: '98%', label: 'Satisfaction' },
    { number: '24/7', label: 'Support' }
  ];

  // How it works steps
  const steps = [
    { icon: '🔍', title: 'Browse & Find', desc: 'Explore expert services from verified Nepali professionals with transparent pricing.' },
    { icon: '📝', title: 'Submit Request', desc: 'Describe your project needs, set your budget in NPR, and choose deadline.' },
    { icon: '🤝', title: 'Get Matched', desc: 'Receive proposals from qualified providers and choose the best fit.' },
    { icon: '📈', title: 'Track Progress', desc: 'Monitor project milestones through our real-time tracking system.' },
    { icon: '💳', title: 'Secure Payment', desc: 'Pay only when satisfied with the work delivered.' },
    { icon: '⭐', title: 'Leave Review', desc: 'Help the community by rating your experience.' }
  ];

  // Categories
  const categories = ['Web Development', 'Logo Design', 'Content Writing', 'Digital Marketing', 'SEO', 'Video Editing'];

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const openAuthModal = () => {
    // Find and click the sign up button in navbar
    const signUpBtn = document.querySelector('.navbar-signup-btn');
    if (signUpBtn) {
      signUpBtn.click();
    } else {
      // Fallback: navigate to home and trigger auth modal
      navigate('/home');
      setTimeout(() => {
        const btn = document.querySelector('.navbar-signup-btn');
        if (btn) btn.click();
      }, 100);
    }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16 md:py-20 lg:py-28 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 md:px-4 py-1.5 mb-4 md:mb-6 shadow-sm">
            <span className="text-indigo-600 text-sm md:text-base">⚡</span>
            <span className="text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-300">Nepal's #1 Service Marketplace</span>
          </div>
          
          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 md:mb-6 leading-tight">
            Find Expert Services<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">For Your Business</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
            Connect with skilled professionals for web development, design, marketing, and more. 
            Pay in Nepali Rupees. Get work done on time.
          </p>
          
          {/* Search Bar */}
          <div className="flex max-w-lg mx-auto gap-2 md:gap-3 mb-6 md:mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search services..."
              className="flex-1 px-3 md:px-5 py-2.5 md:py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
            />
            <button 
              onClick={handleSearch}
              className="px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 text-sm md:text-base whitespace-nowrap"
            >
              Search
            </button>
          </div>
          
          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(cat => (
              <Link 
                key={cat} 
                to={`/services?category=${cat}`} 
                className="px-3 md:px-4 py-1.5 md:py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-xs md:text-sm text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-all hover:scale-105"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 md:py-12 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group">
                <div className="text-2xl md:text-3xl lg:text-4xl font-black text-indigo-600 group-hover:scale-110 transition-transform">
                  {stat.number}
                </div>
                <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 md:mb-8 gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Featured Services</h2>
            <Link to="/services" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm md:text-base transition-colors flex items-center gap-1">
              View all <span className="text-lg">→</span>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl h-72 md:h-80 animate-pulse"></div>
              ))}
            </div>
          ) : featuredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No services available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {featuredServices.slice(0, 4).map(service => (
                <ServiceCard key={service._id} service={service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">How TEYZIX Works</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Simple steps to get your work done</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {steps.map((step, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 transition-transform">
                    {step.icon}
                  </div>
                  <span className="text-xs md:text-sm text-gray-400">Step {i + 1}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base md:text-lg">{step.title}</h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Testimonials Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">What Our Clients Say</h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Trusted by businesses across Nepal</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {clientTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={testimonial.avatar} name={testimonial.name} size={44} />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{testimonial.name}</h4>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <Stars rating={testimonial.rating} size={14} />
                <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 leading-relaxed italic line-clamp-3">
                  "{testimonial.comment}"
                </p>
                <div className="mt-3 text-xs text-gray-400">{testimonial.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews from Platform */}
      {reviews.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Recent Reviews</h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Real feedback from real customers</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {reviews.slice(0, 3).map(review => (
                <div key={review._id} className="bg-white dark:bg-gray-900 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar src={review.customerId?.avatar} name={review.author} size={40} />
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{review.author}</div>
                      <Stars rating={review.rating} size={12} />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 leading-relaxed line-clamp-3">
                    {review.comment}
                  </p>
                  <div className="mt-3 text-xs text-gray-400">{review.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Fixed selector issue */}
      {!user && (
        <section className="py-12 md:py-16 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-indigo-100 text-sm md:text-base mb-6">Join thousands of businesses using TEYZIX</p>
            <button 
              onClick={openAuthModal}
              className="px-6 md:px-8 py-2.5 md:py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 text-sm md:text-base shadow-lg"
            >
              Sign Up Free →
            </button>
          </div>
        </section>
      )}

      {/* Trust Indicators */}
      <section className="py-8 md:py-10 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-4">
            Trusted by 500+ businesses across Nepal
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 opacity-60">
            <span className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">🏢 Secure Payments</span>
            <span className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">⚡ 24/7 Support</span>
            <span className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">🔒 Money Back Guarantee</span>
            <span className="text-sm md:text-base font-semibold text-gray-600 dark:text-gray-400">📱 Easy Tracking</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;