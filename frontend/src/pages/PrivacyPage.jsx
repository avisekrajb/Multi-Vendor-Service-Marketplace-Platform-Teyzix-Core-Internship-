import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: January 1, 2024</p>

      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Information We Collect</h2>
          <p>We collect information you provide directly to us, including name, email address, phone number, and payment information when you create an account or use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">How We Use Your Information</h2>
          <p>We use your information to: provide and improve our services, process payments, communicate with you, prevent fraud, and comply with legal obligations.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Security</h2>
          <p>We implement industry-standard security measures to protect your data. Your password is encrypted and payment information is processed through secure PCI-compliant gateways.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Cookies</h2>
          <p>We use cookies to remember your preferences, analyze site traffic, and provide personalized content. You can disable cookies in your browser settings.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Third-Party Services</h2>
          <p>We may share your information with third-party service providers (payment processors, cloud storage, email services) to operate our platform.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information. Contact us to exercise these rights.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Data Retention</h2>
          <p>We retain your information as long as your account is active or as needed to provide services. You may request account deletion at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Children's Privacy</h2>
          <p>Our services are not intended for children under 18. We do not knowingly collect information from minors.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes via email or platform notification.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Contact Us</h2>
          <p>For privacy concerns, contact our Data Protection Officer at: privacy@teyzix.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;