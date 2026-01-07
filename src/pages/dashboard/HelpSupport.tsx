import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HelpCircle, Mail, Phone, MessageCircle, Book } from "lucide-react";
import { useState, useEffect } from "react";
import { AIChat } from "@/components/ui/ai-chat";
import { supabase } from "@/integrations/supabase/client";

const HelpSupport = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: ''
  });
  const [showAIChat, setShowAIChat] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      setUserRole(data?.role || null);
    }
  };

  const handleInputChange = (field: keyof typeof ticketForm, value: string) => {
    setTicketForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = () => {
    const mailtoUrl = constructMailtoUrl();
    window.location.href = mailtoUrl;
    toast.success("Opening email client...");
  };

  const constructMailtoUrl = () => {
    const email = 'careconnectad@gmail.com';
    const subject = encodeURIComponent(ticketForm.subject);
    const body = encodeURIComponent(`
Category: ${ticketForm.category}

Description:
${ticketForm.description}

---
This support ticket was submitted through CareConnect Help & Support.
    `);

    return `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleEmailSupport = () => {
    window.location.href = 'mailto:careconnectad@gmail.com?subject=Support Request';
  };

  // Patient-specific FAQs
  const patientFAQs = [
    {
      id: "patient-1",
      question: "How do I view my medical records?",
      answer: "Your medical records are available in the 'My Records' section. This includes your personal information, diagnoses, medications, lab results, and imaging studies. Simply navigate to 'My Records' from the sidebar to view all your health information."
    },
    {
      id: "patient-2",
      question: "How do I understand my lab results?",
      answer: "Your lab results show test names, values, and normal ranges. Values marked as 'High' or 'Low' are outside the normal range. If you have questions about specific results, please contact your healthcare provider or submit a support ticket."
    },
    {
      id: "patient-3",
      question: "What do my vital signs mean?",
      answer: "Vital signs include blood pressure, heart rate, temperature, respiratory rate, and oxygen saturation. These measurements help track your overall health. Your healthcare team monitors these to ensure they stay within healthy ranges for you."
    },
    {
      id: "patient-4",
      question: "How do I contact my healthcare provider?",
      answer: "You can reach your healthcare team by calling the hospital's main line or using the contact options on this page. For non-urgent matters, you can also submit a support ticket and we'll connect you with the appropriate department."
    },
    {
      id: "patient-5",
      question: "Who can I contact for billing questions?",
      answer: "For billing inquiries, please contact our billing department at the phone number listed above or send an email through our Email Support option. Include your hospital number for faster assistance."
    }
  ];

  // Staff/Clinical FAQs
  const staffFAQs = [
    {
      id: "staff-1",
      question: "How do I add a new patient?",
      answer: "Navigate to the 'Add Patient' page from the sidebar, fill in the required information including demographics, medical history, and initial vital signs, then click 'Add Patient' to save."
    },
    {
      id: "staff-2",
      question: "How do I view patient records?",
      answer: "Go to 'Patient Records' from the sidebar. You can search for patients by name or hospital number, and click on any patient to view their complete medical record including assessments, medications, and lab results."
    },
    {
      id: "staff-3",
      question: "How do I assign a doctor to a patient?",
      answer: "Open the patient's record, click 'Assign Doctor' button, select the appropriate physician from the dropdown menu, and save the assignment."
    },
    {
      id: "staff-4",
      question: "Can I edit patient information?",
      answer: "Yes, staff members can edit patient information by opening the patient record and clicking the 'Edit' button. Make your changes and save to update the record."
    },
    {
      id: "staff-5",
      question: "How do I archive a patient?",
      answer: "Open the patient record and click the 'Archive' button. Archived patients can be viewed in the 'Archive' tab and can be unarchived if needed."
    }
  ];

  const faqs = userRole === 'patient' ? patientFAQs : staffFAQs;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">
          {userRole === 'patient' 
            ? "Get help understanding your health records and accessing care" 
            : "Get assistance and find answers to your questions"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-elegant transition-shadow">
          <CardHeader>
            <Mail className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Email Support</CardTitle>
            <CardDescription>Get help via email</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              careconnectad@gmail.com
            </p>
            <Button variant="outline" className="w-full" onClick={handleEmailSupport}>Send Email</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-shadow">
          <CardHeader>
            <Phone className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Phone Support</CardTitle>
            <CardDescription>Call us for immediate help</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              +1 (555) 123-4567<br />
              Mon-Fri, 8AM-6PM
            </p>
            <Button variant="outline" className="w-full">Call Now</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-shadow">
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>Chat with our AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              AI Support available 24/7. Human support during business hours.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setShowAIChat(true)}>Start Chat</Button>
          </CardContent>

          <AIChat 
            open={showAIChat}
            onOpenChange={setShowAIChat}
            onEscalateToHuman={() => {
              setShowAIChat(false);
              handleEmailSupport();
              toast.info("Connecting you with a human support agent via email...");
            }}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              {userRole === 'patient' 
                ? "Common questions about your health records" 
                : "Common questions about using CareConnect"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
            <CardDescription>
              {userRole === 'patient'
                ? "Need help with something? Let us know"
                : "Describe your issue and we'll get back to you"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Brief description of your issue"
                value={ticketForm.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input 
                id="category" 
                placeholder={userRole === 'patient' ? "e.g., Records, Billing, General" : "e.g., Technical, Account, General"}
                value={ticketForm.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue..."
                className="min-h-[120px]"
                value={ticketForm.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
            <Button onClick={handleSubmitTicket} className="w-full">
              Submit Ticket
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpSupport;
