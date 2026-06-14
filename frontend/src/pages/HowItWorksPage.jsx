import React from 'react';
import { REQUEST_STATUS_FLOW, STATUS_COLORS } from '../utils/constants';

const HowItWorksPage = () => {
  const steps = [
    { icon: '👤', title: 'Create Account', desc: 'Sign up as customer or service provider in under 2 minutes.' },
    { icon: '🔍', title: 'Browse / Post', desc: 'Explore service listings or post your own with pricing.' },
    { icon: '📩', title: 'Submit Request', desc: 'Describe project, set budget in NPR and deadline.' },
    { icon: '🤝', title: 'Get Matched', desc: 'Provider reviews and accepts. Communication in-platform.' },
    { icon: '📈', title: 'Track Progress', desc: 'Monitor through Pending → Accepted → In Progress → Delivered.' },
    { icon: '⭐', title: 'Leave Review', desc: 'Rate your provider and help the community grow.' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">How TEYZIX Works</h1>
        <p className="text-gray-600 dark:text-gray-400">Transparent process from request to delivery</p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {steps.map((step, idx) => (
          <div key={idx} className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="absolute -top-3 left-6 w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {idx + 1}
            </div>
            <div className="text-4xl mt-4 mb-3">{step.icon}</div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Status Flow */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">Project Status Lifecycle</h2>
        <div className="flex flex-wrap justify-center items-center gap-3">
          {REQUEST_STATUS_FLOW.map((status, idx) => (
            <React.Fragment key={status}>
              <div 
                className="px-5 py-2 rounded-full text-sm font-semibold"
                style={{ 
                  backgroundColor: `${STATUS_COLORS[status]}20`, 
                  color: STATUS_COLORS[status],
                  border: `1px solid ${STATUS_COLORS[status]}40`
                }}
              >
                {status}
              </div>
              {idx < REQUEST_STATUS_FLOW.length - 1 && (
                <span className="text-gray-400 text-xl">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>💰 Payments are held in escrow until project completion</p>
          <p className="mt-1">🛡️ TEYZIX charges 10% service fee on successful transactions</p>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'How do I get paid as a provider?', a: 'Payments are released to your account after project completion and customer approval. You can withdraw to your bank account.' },
            { q: 'Is my payment secure?', a: 'Yes! All payments are held in secure escrow until you approve the work delivered by the provider.' },
            { q: 'What if I\'m not satisfied with the work?', a: 'You can open a dispute, and our admin team will review and resolve the issue fairly.' },
            { q: 'How long does delivery take?', a: 'Delivery times vary by service. Each service listing specifies the estimated delivery time.' },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;