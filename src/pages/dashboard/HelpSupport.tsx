import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HelpCircle, Mail, Phone, MessageCircle, Book } from "lucide-react";
import { useState } from "react";
import { AIChat } from "@/components/ui/ai-chat";

const HelpSupport = () => {
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: ''
  });
  const [showAIChat, setShowAIChat] = useState(false);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Help & Support
        </h1>
        <p className="text-muted-foreground">Get assistance and find answers to your questions</p>
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
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I add a new patient?</AccordionTrigger>
                <AccordionContent>
                  Navigate to the "Add Patient" page from the sidebar, fill in the required information including demographics, medical history, and initial vital signs, then click "Add Patient" to save.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do I view patient records?</AccordionTrigger>
                <AccordionContent>
                  Go to "Patient Records" from the sidebar. You can search for patients by name or hospital number, and click on any patient to view their complete medical record including assessments, medications, and lab results.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How do I assign a doctor to a patient?</AccordionTrigger>
                <AccordionContent>
                  Open the patient's record, click "Assign Doctor" button, select the appropriate physician from the dropdown menu, and save the assignment.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I edit patient information?</AccordionTrigger>
                <AccordionContent>
                  Yes, staff members can edit patient information by opening the patient record and clicking the "Edit" button. Make your changes and save to update the record.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>How do I archive a patient?</AccordionTrigger>
                <AccordionContent>
                  Open the patient record and click the "Archive" button. Archived patients can be viewed in the "Archive" tab and can be unarchived if needed.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit a Support Ticket</CardTitle>
            <CardDescription>Describe your issue and we'll get back to you</CardDescription>
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
                placeholder="e.g., Technical, Account, General"
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
