import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sanitizeError } from "@/lib/errorHandling";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  content: string;
  read: boolean;
  created_at: string;
}

interface NormalizedUser {
  user_id: string;
  role: string;
  display: string;
  raw?: any;
}

interface StaffRecipient {
    user_id: string;
    role: string;
    display_name: string;
}

const ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "radtech", label: "RadTech" },
  { value: "medtech", label: "MedTech" },
  { value: "staff", label: "Admin" },
];

export default function Messages(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<NormalizedUser[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const user = (data as any)?.user;
        if (user) setCurrentUserId(user.id);
      } catch (err) {
        console.error("getUser error", err);
      }
    })();

    void fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data, error } = await (supabase.rpc as any)('get_all_staff_recipients') as { data: StaffRecipient[] | null, error: any };

      if (error) throw error;
      
      const rpcResults = data ?? [];

      const normalized: NormalizedUser[] = rpcResults
        .filter(r => r.user_id !== null)
        .map(r => ({
          user_id: r.user_id,
          role: r.role.toLowerCase(),
          display: r.display_name,
          raw: r,
        }));
      
      const uniqueUsers = Array.from(new Map(normalized.map(u => [u.user_id, u])).values());
      setUsers(uniqueUsers);

    } catch (err) {
      console.error("fetchUsers error", err);
      toast.error(sanitizeError(err as any));
    }
  }

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setMessages((data as Message[]) || []);
    } catch (err) {
      console.error("fetchMessages error", err);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    void fetchMessages();

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${currentUserId}` },
        () => {
          void fetchMessages()
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchMessages]);
  
  async function handleMessageSelect(message: Message) {
    setSelectedMessage(message);
    
    if (!message.read && message.recipient_id === currentUserId) {
      try {
        const { error } = await supabase
          .from("messages")
          .update({ read: true })
          .eq("id", message.id)
          .select()
          .single();

        if (error) throw error;
        
        setMessages(prevMessages => 
          prevMessages.map(m => (m.id === message.id ? { ...m, read: true } : m))
        );
      } catch (err) {
        console.error("Error marking message as read", err);
        toast.error("Failed to mark message as read.");
      }
    }
  }

  async function sendMessage() {
    if (!messageText?.trim()) return toast.error("Please enter a message");
    if (!selectedRecipient) return toast.error("Please select a recipient");
    if (!currentUserId) return toast.error("Unable to determine current user");

    const recipient = users.find((u) => u.user_id === selectedRecipient);
    if (!recipient || !recipient.user_id) return toast.error("Selected recipient is invalid");

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        recipient_id: recipient.user_id,
        subject: messageSubject || null,
        content: messageText,
        read: false,
      });
      if (error) throw error;
      
      toast.success("Message sent");
      setMessageText("");
      setMessageSubject("");
      
      if (!selectedMessage) {
        setSelectedRecipient("");
        setSelectedRole("");
      }

      void fetchMessages();
    } catch (err) {
      console.error("sendMessage error", err);
      toast.error(sanitizeError(err as any));
    }
  }

  const getUserLabel = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return "Unknown";

    const roleLabel = ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role;
    
    return `${user.display} (${roleLabel})`;
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const term = searchTerm.toLowerCase();
      const otherUserId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
      const otherUserLabel = getUserLabel(otherUserId).toLowerCase();
      
      return (
        otherUserLabel.includes(term) ||
        m.content.toLowerCase().includes(term) || 
        (m.subject && m.subject.toLowerCase().includes(term))
      );
    });
  }, [messages, searchTerm, currentUserId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Messages
        </h1>
        <p className="text-muted-foreground">Communicate with your team</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users or messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredMessages.map((message) => {
                const isSent = message.sender_id === currentUserId;
                const otherUserId = isSent ? message.recipient_id : message.sender_id;
                const otherUserLabel = getUserLabel(otherUserId);
                
                return (
                  <div 
                    key={message.id} 
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedMessage?.id === message.id ? "bg-muted" : ""} ${!message.read && !isSent ? 'font-semibold' : ''}`} 
                    onClick={() => void handleMessageSelect(message)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{otherUserLabel.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm truncate">
                            <span className="font-medium">{otherUserLabel}</span>
                            {isSent && <span className="text-xs text-muted-foreground ml-1">(To)</span>}
                            {!isSent && <span className="text-xs text-muted-foreground ml-1">(From)</span>}
                          </p>
                          {!message.read && !isSent && <Badge variant="default" className="text-xs">New</Badge>}
                        </div>
                        {message.subject && <p className="text-sm font-medium truncate">{message.subject}</p>}
                        <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(message.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedMessage ? `Conversation with ${getUserLabel(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id)}` : "New Message"}</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedMessage ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Recipient Type</label>
                      <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v); setSelectedRecipient(""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Recipient</label>
                      <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedRole ? "Select recipient" : "Select type first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.user_id !== currentUserId && (!selectedRole || u.role.toLowerCase() === selectedRole.toLowerCase())).length === 0 ? (
                            <SelectItem value="__no_users__" disabled>No users found for this role</SelectItem>
                          ) : (
                            users.filter(u => u.user_id !== currentUserId && (!selectedRole || u.role.toLowerCase() === selectedRole.toLowerCase())).map((user) => (
                              <SelectItem key={user.user_id} value={user.user_id}>{user.display} ({ROLE_OPTIONS.find(r => r.value === user.role)?.label || user.role})</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Input placeholder="Subject (optional)" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} />
                </div>

                <div className="flex gap-2">
                  <Textarea placeholder="Type your message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-h-[200px]" />
                  <Button className="self-end" onClick={sendMessage} disabled={!selectedRecipient || !messageText.trim()}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  {selectedMessage.subject && <p className="font-semibold text-sm mb-2">Subject: {selectedMessage.subject}</p>}
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedMessage.sender_id === currentUserId ? "Sent" : "Received"} on {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Input placeholder="Subject (optional)" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} />
                  <div className="flex gap-2">
                    <Textarea placeholder={`Type your reply to ${getUserLabel(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id)}...`} value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-h-[80px]" />
                    <Button 
                      className="self-end" 
                      onClick={() => { 
                        setSelectedRecipient(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id); 
                        void sendMessage(); 
                      }}
                      disabled={!messageText.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}