import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateAIResponse } from "@/lib/ai-support";
import { createSupportTicket } from "@/lib/support";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  type: 'ai' | 'user';
  content: string;
}

interface AIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEscalateToHuman: () => void;
}

export function AIChat({ open, onOpenChange, onEscalateToHuman }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { type: 'ai', content: 'Hello! I\'m your CareConnect AI assistant. I can help you with questions about our system, features, and services. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { type: 'user' as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Generate AI response with a slight delay for natural feel
    setTimeout(() => {
      const response = generateAIResponse(input);
      setMessages(prev => [...prev, { type: 'ai', content: response }]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscalate = async () => {
    // Gather last few messages as context
    const lastMessages = messages.slice(-10).map(m => `${m.type === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n\n');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      // Create a support ticket
      const subject = 'Escalation from AI Chat';
      const category = 'AI Support Escalation';
      const description = `User escalated a chat to human support. Conversation:\n\n${lastMessages}`;

      await createSupportTicket(userId, subject, category, description);
      toast.success('Support ticket created. A human agent will contact you.');
      onEscalateToHuman();
    } catch (err: any) {
      console.error('Failed to create support ticket', err);
      toast.error('Failed to create support ticket. Opening email client instead.');
      onEscalateToHuman();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Support Chat
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 text-sm",
                    message.type === 'user' && "flex-row-reverse"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {message.type === 'ai' ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%]",
                      message.type === 'ai' 
                        ? "bg-muted" 
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    Typing...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={onEscalateToHuman}
            >
              <UserCog className="h-4 w-4" />
              Connect with Human Agent
            </Button>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[80px]"
              />
              <Button 
                className="self-end"
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}