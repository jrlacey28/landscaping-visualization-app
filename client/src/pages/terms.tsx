import { POLICY_EFFECTIVE_DATE } from "@shared/legal";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import { useTenant } from "@/hooks/use-tenant";

export default function TermsPage() {
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
              <CardTitle className="text-3xl text-white">Terms of Service</CardTitle>
              <p className="text-slate-300">Last updated: {POLICY_EFFECTIVE_DATE}</p>
            </CardHeader>
            <CardContent className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
                <p>By accessing and using DreamBuilder AI ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">2. Description of Service</h2>
                <p className="mb-3">DreamBuilder AI provides AI-powered visualization services for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Roofing and siding design visualization</li>
                  <li>Landscape design and planning</li>
                  <li>Pool design and visualization</li>
                  <li>Custom embed widgets for business websites</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">3. User Accounts</h2>
                <p className="mb-3">To access certain features, you must create an account. You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your account information</li>
                  <li>Keep your account credentials secure</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">4. Acceptable Use</h2>
                <p className="mb-3">You agree NOT to use the service to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Upload images you don't own or have rights to use</li>
                  <li>Generate inappropriate, offensive, or illegal content</li>
                  <li>Attempt to reverse engineer or copy our AI models</li>
                  <li>Violate any local, state, national, or international laws</li>
                  <li>Interfere with or disrupt the service or servers</li>
                  <li>Use the service for commercial resale without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">5. Subscription Plans and Billing</h2>
                <div className="space-y-3">
                  <p><strong>Free Plan:</strong> 5 visualizations per month</p>
                  <p><strong>Contractor Plan:</strong> $300/month - 200 visualizations per month</p>
                  <p><strong>Professional Plan:</strong> $500/month - 650 visualizations per month with team collaboration</p>
                  <p><strong>Enterprise Plan:</strong> Custom pricing - Higher visualization amount plus white-label features</p>
                  <div className="mt-4">
                    <p className="mb-2"><strong>Billing Terms:</strong></p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Subscriptions are billed monthly in advance</li>
                      <li>Usage limits reset monthly</li>
                      <li>No refunds for unused visualizations</li>
                      <li>You can cancel anytime; access continues until period end</li>
                      <li>Failed payments may result in service suspension</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">6. Intellectual Property</h2>
                <p className="mb-3">Regarding content and intellectual property:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Your Content:</strong> You retain rights to images you upload</li>
                  <li><strong>Generated Content:</strong> You own the AI-generated visualizations created from your images</li>
                  <li><strong>Our Platform:</strong> We retain all rights to our software, AI models, and platform</li>
                  <li><strong>License:</strong> You grant us license to process your images to provide the service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">7. Privacy and Data</h2>
                <p>Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your information when you use our service.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">8. Service Availability</h2>
                <p>While we strive for high availability, we do not guarantee uninterrupted service. We may temporarily suspend service for maintenance, updates, or due to circumstances beyond our control.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">9. Limitation of Liability</h2>
                <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, DREAMBUILDER AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">10. Disclaimers</h2>
                <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">11. Termination</h2>
                <p className="mb-3">We may terminate or suspend your account:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>For violation of these terms</li>
                  <li>For non-payment of fees</li>
                  <li>At our sole discretion with or without notice</li>
                </ul>
                <p className="mt-3">You may terminate your account at any time through your account settings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">12. Governing Law</h2>
                <p>These terms shall be interpreted and governed by the laws of the United States. Any disputes shall be resolved in the appropriate courts.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">13. Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via email or service notifications. Continued use constitutes acceptance of modified terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3 text-white">14. Contact Information</h2>
                <p>For questions about these Terms of Service, contact us:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Email: legal@dreambuilderai.com</li>
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
