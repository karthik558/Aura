import { motion } from "framer-motion";
import { Shield, Lock, Eye, Database, UserCheck, Mail } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

const sections = [
  {
    icon: Database,
    title: "Information We Collect",
    content: `We collect information you provide directly to us, such as when you create an account, submit permit applications, or contact us for support. This may include:

• Name and contact information (email address, phone number)
• Organization and property details
• Permit application data and guest information
• Login credentials and account preferences
• Communications with our support team`
  },
  {
    icon: Eye,
    title: "How We Use Your Information",
    content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process permit applications and manage guest records
• Send you technical notices, updates, and support messages
• Respond to your comments, questions, and customer service requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and other illegal activities`
  },
  {
    icon: Lock,
    title: "Information Security",
    content: `We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. These measures include:

• Encryption of data in transit and at rest
• Regular security assessments and audits
• Access controls and authentication mechanisms
• Secure data centers with physical security measures
• Employee training on data protection practices`
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content: `Depending on your location, you may have certain rights regarding your personal information:

• Access: Request a copy of your personal data
• Correction: Request correction of inaccurate data
• Deletion: Request deletion of your personal data
• Portability: Request transfer of your data to another service
• Objection: Object to certain processing of your data
• Restriction: Request restriction of processing`
  },
  {
    icon: Shield,
    title: "Data Retention",
    content: `We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including to satisfy any legal, accounting, or reporting requirements.

When determining the appropriate retention period, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure, and applicable legal requirements.`
  },
  {
    icon: Mail,
    title: "Contact Us",
    content: `If you have any questions about this Privacy Policy or our privacy practices, please contact us at:

• Email: privacy@aura-permits.com
• Address: 123 Business Park, Tech City, TC 12345
• Phone: +1 (555) 123-4567

We aim to respond to all legitimate requests within 30 days.`
  },
];

const PrivacyPolicy = () => {
  useDocumentTitle("Privacy Policy");

  return (
    <motion.div 
      variants={container} 
      initial="hidden" 
      animate="show" 
      className="max-w-4xl mx-auto"
    >
      <Breadcrumbs />
      
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 18, 2026</p>
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          At Aura, we take your privacy seriously. This Privacy Policy explains how we collect, 
          use, disclose, and safeguard your information when you use our permit management platform.
        </p>
      </motion.div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <motion.div
            key={section.title}
            variants={item}
            className="bg-card rounded-2xl border border-border p-6 hover:shadow-soft transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground mb-3">{section.title}</h2>
                <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <motion.div 
        variants={item} 
        className="mt-8 p-4 rounded-xl bg-muted/50 text-center"
      >
        <p className="text-sm text-muted-foreground">
          By using Aura, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PrivacyPolicy;