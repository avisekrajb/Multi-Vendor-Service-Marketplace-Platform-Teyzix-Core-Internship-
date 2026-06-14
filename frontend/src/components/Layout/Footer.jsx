import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TEYZIX
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nepal's #1 Service Marketplace connecting clients with expert professionals.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/home" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">Home</Link></li>
              <li><Link to="/services" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">Services</Link></li>
              <li><Link to="/works" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">How It Works</Link></li>
              <li><Link to="/providers" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">Providers</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-indigo-600">Privacy Policy</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email: support@teyzix.com</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Phone: +977 1 1234567</p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          © 2024 TEYZIX. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;