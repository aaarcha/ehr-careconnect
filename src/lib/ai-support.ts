interface KnowledgeEntry {
  keywords: string[];
  response: string;
}

// Knowledge base for CareConnect-specific information
const careConnectKnowledge: KnowledgeEntry[] = [
  {
    keywords: ['what is', 'about', 'careconnect', 'care connect', 'system'],
    response: `CareConnect is a comprehensive healthcare management system designed to streamline patient care, improve communication between healthcare providers, and enhance the overall healthcare experience. It provides integrated tools for managing patient records, laboratory results, imaging, and communication between healthcare professionals.`
  },
  {
    keywords: ['vision', 'vision statement'],
    response: `CareConnect's vision is to revolutionize healthcare by connecting people, information, and compassion through a seamless digital platform that inspires trust and improves lives.`
  },
  {
    keywords: ['mission', 'mission statement', 'purpose'],
    response: `CareConnect is dedicated to enhancing the quality of healthcare through innovation, collaboration, and compassion. We strive to provide accessible, efficient, and patient-centered healthcare solutions.`
  },
  {
    keywords: ['features', 'capabilities', 'what can', 'functions', 'do'],
    response: `CareConnect offers several key features:
1. Patient Record Management - Complete digital health records
2. Laboratory Management - Track and manage lab tests and results
3. Imaging Services - Handle medical imaging and reports
4. Staff Communication - Secure messaging between healthcare providers
5. Support System - 24/7 AI assistance with human support escalation
6. Real-time Updates - Instant access to patient information
7. Secure Access - Role-based authentication and data protection`
  },
  {
    keywords: ['security', 'privacy', 'data', 'protection'],
    response: `CareConnect takes security and privacy seriously. We implement:
- Role-based access control
- Secure authentication
- Encrypted data storage
- HIPAA compliance measures
- Regular security audits
All patient data is protected and only accessible to authorized healthcare providers.`
  },
  {
    keywords: ['contact', 'support hours', 'help', 'assistance'],
    response: `CareConnect provides multiple support channels:
- 24/7 AI Assistant (that's me!)
- Email Support: careconnectad@gmail.com
- Phone Support: +1 (555) 123-4567 (Mon-Fri, 8AM-6PM)
- Live Chat with human agents during business hours`
  },
  {
    keywords: ['login', 'log in', 'sign in', 'signin', 'credentials', 'access'],
    response: `To log in to CareConnect you must have an authorized account for your role. Accounts are provisioned by your facility administrator. If you don't have credentials, please contact your admin or request access via your organization's IT or admin team. For system-level support, email careconnectad@gmail.com.`
  },
  {
    keywords: ['radtech', 'rad tech', 'radiology', 'radiographer'],
    response: `To log in as a RadTech (radiology technologist) you must be a certified radiology professional employed or contracted by the facility. Access requires a RadTech role assignment and credentials provided by the facility admin. Please contact your administrator to request a RadTech account and appropriate permissions. If you need system help, email careconnectad@gmail.com.`
  },
  {
    keywords: ['medtech', 'med tech', 'medical technologist', 'lab tech'],
    response: `To log in as a MedTech (medical technologist) you must be a licensed lab professional affiliated with the facility. MedTech accounts and permissions are granted by the facility admin. Reach out to your administrator to request access. For technical assistance, email careconnectad@gmail.com.`
  },
  {
    keywords: ['admin', 'administrator', 'system admin'],
    response: `Administrators have elevated permissions to manage users and roles. If you are an admin and need to create or manage accounts, use the Admin section in CareConnect. For onboarding support or to delegate admin rights, contact careconnectad@gmail.com.`
  },
  {
    keywords: ['patient', 'records', 'information'],
    response: `CareConnect's patient record system allows healthcare providers to:
- View complete patient history
- Update medical records in real-time
- Track vital signs and assessments
- Manage medications and treatments
- Document patient progress
- Share information securely with other providers`
  },
  {
    keywords: ['laboratory', 'lab', 'tests', 'results'],
    response: `Our laboratory management system enables:
- Order and track lab tests
- View and manage test results
- Set normal ranges and flag abnormal results
- Generate comprehensive lab reports
- Notify healthcare providers of critical results
- Maintain test history for each patient`
  },
  {
    keywords: ['imaging', 'radiology', 'scan', 'xray', 'x-ray'],
    response: `CareConnect's imaging services include:
- Schedule imaging procedures
- Store and view digital images
- Generate detailed reports
- Track patient radiation exposure
- Share images securely with specialists
- Maintain complete imaging history`
  },
  {
    keywords: ['emergency', 'urgent', 'immediate', 'critical'],
    response: `For urgent matters, I recommend:
1. During business hours (8AM-6PM): Call our support line at +1 (555) 123-4567
2. For system emergencies: Email careconnectad@gmail.com
3. For medical emergencies: Please contact your facility's emergency services directly

Would you like me to connect you with a human support agent immediately?`
  }
];

export function generateAIResponse(userInput: string): string {
  const input = userInput.toLowerCase();
  
  // Check for emergency/urgent keywords first
  if (input.includes('emergency') || input.includes('urgent') || input.includes('critical')) {
    return careConnectKnowledge.find(k => k.keywords.includes('emergency'))?.response || '';
  }

  // Find the most relevant knowledge entry
  const relevantEntry = careConnectKnowledge.find(entry =>
    entry.keywords.some(keyword => input.includes(keyword))
  );

  if (relevantEntry) {
    return relevantEntry.response;
  }

  // Default response if no matching keywords
  return `I'm here to help with any questions about CareConnect! You can ask about our:
- Vision and mission
- System features and capabilities
- Patient records management
- Laboratory and imaging services
- Security and privacy measures
- Support options and contact information

What would you like to know more about?`;
}