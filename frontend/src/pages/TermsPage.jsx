import React from 'react';

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms & Conditions</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: January 1, 2024</p>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using TEYZIX marketplace, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">2. User Accounts</h2>
          <p>You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Services and Payments</h2>
          <p>TEYZIX connects customers with service providers. All payments are processed securely through our platform. TEYZIX charges a 10% service fee on each completed transaction.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Provider Responsibilities</h2>
          <p>Providers must deliver services as described within the agreed timeframe. Failure to do so may result in account suspension or termination.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Customer Responsibilities</h2>
          <p>Customers must provide clear requirements and cooperate with providers. Payment is held in escrow until project completion and customer approval.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Dispute Resolution</h2>
          <p>Any disputes between customers and providers will be reviewed by TEYZIX admin team. We aim to resolve disputes within 7 business days.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Prohibited Activities</h2>
          <p>You may not: post fraudulent services, engage in spam, harass other users, attempt to bypass our payment system, or violate any applicable laws.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">8. Termination</h2>
          <p>TEYZIX reserves the right to suspend or terminate accounts that violate these terms or engage in harmful activities.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
          <p>TEYZIX is not liable for any indirect, incidental, or consequential damages arising from your use of our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">10. Contact Us</h2>
          <p>For questions about these Terms, contact us at: support@teyzix.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;