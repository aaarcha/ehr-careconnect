import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  unread?: boolean;
}

const mockMessages: Message[] = [
  { id: 1, sender: "Dr. Smith", content: "Patient in Room 204 needs urgent attention", time: "10:30 AM", unread: true },
  { id: 2, sender: "Nurse Johnson", content: "Vital signs recorded for all patients", time: "9:15 AM" },
  { id: 3, sender: "Admin", content: "System maintenance scheduled for tonight", time: "Yesterday" },
  { id: 4, sender: "Dr. Williams", content: "Lab results are ready for review", time: "Yesterday", unread: true },
];

const Messages = () => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMessages = mockMessages.filter((msg) =>
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{message.sender}</p>
                        {message.unread && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{message.time}</p>
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
              {selectedMessage ? selectedMessage.sender : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm">{selectedMessage.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">{selectedMessage.time}</p>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button className="self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
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
