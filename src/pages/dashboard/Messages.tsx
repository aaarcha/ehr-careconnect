import { useState, useEffect } from "react";
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

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [messageSubject, setMessageSubject] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      
      // Subscribe to real-time message updates
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${currentUserId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, account_number, patient_number");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!messageText || !selectedRecipient || !currentUserId) {
      toast.error("Please select a recipient and enter a message");
      return;
    }

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          recipient_id: selectedRecipient,
          subject: messageSubject || null,
          content: messageText,
          read: false
        });

      if (error) throw error;

      toast.success("Message sent successfully");
      setMessageText("");
      setMessageSubject("");
      setSelectedRecipient("");
      fetchMessages();
    } catch (error: any) {
      toast.error(sanitizeError(error));
    }
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.subject && msg.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserLabel = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return "Unknown";
    return user.account_number || user.patient_number || `${user.role} User`;
  };

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
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedMessage?.id === message.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (!message.read && message.recipient_id === currentUserId) {
                      markAsRead(message.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getUserLabel(message.sender_id === currentUserId ? message.recipient_id : message.sender_id).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">
                          {getUserLabel(message.sender_id === currentUserId ? message.recipient_id : message.sender_id)}
                        </p>
                        {!message.read && message.recipient_id === currentUserId && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      {message.subject && (
                        <p className="text-sm font-medium truncate">{message.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedMessage ? getUserLabel(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id) : "New Message"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      {selectedMessage.subject && (
                        <p className="font-semibold text-sm mb-2">Subject: {selectedMessage.subject}</p>
                      )}
                      <p className="text-sm">{selectedMessage.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(selectedMessage.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </ScrollArea>

                <div className="space-y-2">
                  <Input
                    placeholder="Subject (optional)"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button 
                      className="self-end"
                      onClick={() => {
                        setSelectedRecipient(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id);
                        sendMessage();
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient</label>
                  <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.user_id !== currentUserId).map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.account_number || user.patient_number} - {user.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Subject (optional)"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button className="self-end" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;