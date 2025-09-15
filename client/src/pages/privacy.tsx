
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import { useTenant } from "@/hooks/use-tenant";

export default function PrivacyPage() {
  const { tenant } = useTenant();
  
  // Create fallback tenant if API call fails
  const effectiveTenant = tenant || {
    id: 1,
    userId: null,
    slug: "demo",
    companyName: "DreamBuilder",
    logoUrl: null,
    primaryColor: "#2563EB", 
    secondaryColor: "#059669",
    phone: null,
    email: null,
    address: null,
    description: "Professional AI-powered landscaping visualization services",
    showPricing: true,
    requirePhone: true,
    active: true,
    monthlyGenerationLimit: 1000,
    currentMonthGenerations: null,
    contactPhone: null,
    embedEnabled: false,
    embedCtaText: null,
    embedCtaPhone: null,
    embedCtaUrl: null,
    embedPrimaryColor: null,
    embedSecondaryColor: null,
    lastResetDate: new Date(),
    createdAt: new Date(),
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white">
      <Header tenant={effectiveTenant} />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Privacy Policy</CardTitle>
              <p className="text-slate-300">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">1. Information We Collect</h2>
                <p className="mb-3">We collect information you provide directly to us and information automatically collected when you use our service:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Google Account Information:</strong> When you sign in with Google, we collect your email address, name, and profile picture as provided by Google.</li>
                  <li><strong>Account Information:</strong> Email address, first name, last name, business name (optional), and phone number (optional).</li>
                  <li><strong>Usage Data:</strong> Information about how you use our visualization services, including generated images and usage statistics.</li>
                  <li><strong>Payment Information:</strong> Payment processing is handled by Stripe. We store subscription status but not payment card details.</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage analytics.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">2. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide and maintain our AI visualization services</li>
                  <li>Process your account registration and authentication</li>
                  <li>Handle billing and subscription management</li>
                  <li>Send service-related communications</li>
                  <li>Improve our services and develop new features</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">3. Information Sharing and Disclosure</h2>
                <p className="mb-3">We do not sell your personal information. We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Providers:</strong> With third-party services like Stripe for payment processing and Google for authentication</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, sale, or transfer of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">4. Data Security</h2>
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">5. Your Rights</h2>
                <p className="mb-3">You have the following rights regarding your personal information:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Request a copy of your data in a structured format</li>
                  <li><strong>Objection:</strong> Object to processing of your personal information</li>
                </ul>
                <p className="mt-3">To exercise these rights, contact us at privacy@dreambuilderai.com</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">6. Cookies and Tracking</h2>
                <p>We use cookies and similar technologies to maintain your session, remember your preferences, and analyze usage patterns. You can control cookies through your browser settings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">7. Data Retention</h2>
                <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Account information is retained until you delete your account.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">8. Children's Privacy</h2>
                <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">9. International Transfers</h2>
                <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">10. Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">11. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Email: privacy@dreambuilderai.com</li>
                  <li>Website: /contact</li>
                </ul>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
