import { useEffect, useMemo, useState } from "react";
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
import { matchNurse } from "@/lib/matching";
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
  user_id: string | null;
  role: string;
  display: string;
  raw?: any;
}

const ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "medtech", label: "MedTech" },
  { value: "radtech", label: "RadTech" },
  { value: "staff", label: "Staff" },
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

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchMessages();

    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${currentUserId}` },
        () => fetchMessages()
      )
      .subscribe();

    return () => void supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  async function fetchUsers() {
    try {
      // Query all medical staff tables directly using user_id field
      // Fetch user_roles first since we need to match against all staff types
      const userRolesRes = await supabase
        .from("user_roles")
        .select("user_id, role, account_number, patient_number")
        .in('role', ['staff', 'medtech', 'radtech']) // Only valid enum values
        .limit(500);

      // Log user roles for debugging with forced stringification
      if (userRolesRes.error) {
        console.error("Error fetching user_roles:", JSON.stringify(userRolesRes.error, null, 2));
      } else {
        const userRolesInfo = userRolesRes.data?.map(ur => ({
          role: ur.role,
          user_id: ur.user_id,
          account_number: ur.account_number,
          patient_number: ur.patient_number
        }));
        console.log("User roles found - RAW DATA:", JSON.stringify(userRolesInfo, null, 2));
      }

      // Then fetch staff records
      const [medtechsRes, radtechsRes] = await Promise.all([
        supabase.from("medtechs").select("id, name, account_number, user_id").limit(100),
        supabase.from("radtechs").select("id, name, account_number, user_id").limit(100),
      ]);

      // Then fetch doctors/nurses (they don't have user_id column yet)
      // Also fetch auth users to help with matching
      const [doctorsRes, nursesRes] = await Promise.all([
        supabase.from("doctors").select("id, name, specialty").limit(100),
        supabase.from("nurses").select("id, name, nurse_no, department").limit(100)
      ]);

      // Get auth users through the auth API instead of direct table access
      // Try to list auth users using the admin API. This requires service_role
      // privileges. If the request is forbidden (403) we'll fall back to
      // best-effort matching using the `user_roles` table (numeric suffix matching).
      let authUsers: any[] = [];
      try {
        const listRes = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
        authUsers = listRes.data?.users ?? [];
      } catch (err: any) {
        // Common reason: calling admin.listUsers with the anon key -> 403
        console.error("supabase.auth.admin.listUsers error:", err);
        // Helpful user-facing guidance
        if (err?.status === 403 || (err?.response && err.response.status === 403) || String(err.message).toLowerCase().includes('forbidden') || String(err.message).toLowerCase().includes('permission')) {
          console.warn("Insufficient privileges to list auth users (403). Falling back to best-effort matching using user_roles table.");
          toast.warning("Unable to list auth users (403). Falling back to best-effort matching. To fully resolve, use a service_role key for admin actions.");
        } else {
          toast.error(sanitizeError(err));
        }
        authUsers = [];
      }

      // Log results in development to help identify any remaining auth link issues
      // eslint-disable-next-line no-console
      console.debug("staff fetch results:", {
        doctors: { data: doctorsRes.data, error: doctorsRes.error },
        nurses: { data: nursesRes.data, error: nursesRes.error },
        medtechs: { data: medtechsRes.data, error: medtechsRes.error },
        radtechs: { data: radtechsRes.data, error: radtechsRes.error }
      });

      const normalized: NormalizedUser[] = [];

      // Handle any errors first and show detailed error info
      if (doctorsRes.error) {
        console.error("Error fetching doctors:", {
          message: doctorsRes.error.message,
          details: doctorsRes.error.details,
          hint: doctorsRes.error.hint
        });
        toast.error(`Error fetching doctors: ${doctorsRes.error.message}`);
      }
      if (nursesRes.error) {
        console.error("Error fetching nurses:", {
          message: nursesRes.error.message,
          details: nursesRes.error.details,
          hint: nursesRes.error.hint
        });
        toast.error(`Error fetching nurses: ${nursesRes.error.message}`);
      }
      if (medtechsRes.error) {
        console.error("Error fetching medtechs:", {
          message: medtechsRes.error.message,
          details: medtechsRes.error.details,
          hint: medtechsRes.error.hint
        });
        toast.error(`Error fetching medtechs: ${medtechsRes.error.message}`);
      }
      if (radtechsRes.error) {
        console.error("Error fetching radtechs:", {
          message: radtechsRes.error.message,
          details: radtechsRes.error.details,
          hint: radtechsRes.error.hint
        });
        toast.error(`Error fetching radtechs: ${radtechsRes.error.message}`);
      }

      const userRoles = !userRolesRes.error && userRolesRes.data ? userRolesRes.data : [];

      // Log full details of available user roles
      console.log("User Roles Details:", userRoles.map(ur => ({
        role: ur.role,
        user_id: ur.user_id,
        account_number: ur.account_number,
        patient_number: ur.patient_number,
        data: ur  // Log the full object to see all available fields
      })));

      // Also let's try fetching just the current user's role for context
      if (currentUserId) {
        const userRole = userRoles.find(ur => ur.user_id === currentUserId);
        console.log("Current user's role:", userRole ? {
          role: userRole.role,
          account_number: userRole.account_number,
          patient_number: userRole.patient_number
        } : "Not found");
      }

      // Log auth users for matching
      console.log("Auth users found:", authUsers.map(u => ({
        id: u.id,
        email: u.email,
        metadata: u.user_metadata
      })));

      // First add medtechs/radtechs which already have user_id column
      if (medtechsRes.data) {
        const medtechs = medtechsRes.data.filter(m => m.user_id != null);
        if (medtechs.length === 0) {
          console.log("No medtechs found with user_id");
        }
        normalized.push(
          ...medtechs.map((m: any) => ({
            user_id: m.user_id,
            role: "medtech",
            display: m.name || m.account_number || 'Unknown MedTech',
            raw: m,
          }))
        );
      }

      if (radtechsRes.data) {
        const radtechs = radtechsRes.data.filter(r => r.user_id != null);
        if (radtechs.length === 0) {
          console.log("No radtechs found with user_id");
        }
        normalized.push(
          ...radtechs.map((r: any) => ({
            user_id: r.user_id,
            role: "radtech",
            display: r.name || r.account_number || 'Unknown RadTech',
            raw: r,
          }))
        );
      }

      // Then try to match doctors/nurses with user_roles entries
      // Log the available user roles for matching
      console.log("Available user_roles for matching:", userRoles.map(ur => ({
        role: ur.role,
        account_number: ur.account_number,
        patient_number: ur.patient_number
      })));

      if (doctorsRes.data) {
        const doctors = doctorsRes.data;
        console.log("Processing doctors - RAW DATA:", JSON.stringify({
          total: doctors.length,
          available: doctors.map(d => ({
            id: d.id,
            name: d.name,
            specialty: d.specialty
          }))
        }, null, 2));
        
        for (const d of doctors) {
          // Log each doctor we're trying to match
          console.log("Attempting to match doctor:", {
            name: d.name,
            specialty: d.specialty,
            possibleMatches: userRoles.filter(ur => 
              ur.role === 'staff' && 
              (ur.account_number === d.name || ur.patient_number === d.name)
            )
          });

          // Try to find matching user_role by name - handling "Dr." prefix
          const nameWithoutPrefix = d.name.replace(/^Dr\.\s+/, '');
          console.log("Trying doctor match with:", {
            original: d.name,
            withoutPrefix: nameWithoutPrefix,
            userRoles: userRoles.map(ur => ({
              role: ur.role,
              account: ur.account_number
            }))
          });

          const match = userRoles.find(ur => 
            ur.role === 'staff' && 
            (ur.account_number === d.name || 
             ur.account_number === nameWithoutPrefix ||
             ur.patient_number === d.name ||
             ur.patient_number === nameWithoutPrefix)
          );
          
          if (match?.user_id) {
            normalized.push({
              user_id: match.user_id,
              role: "doctor",
              display: d.name.startsWith('Dr.') ? `${d.name} (${d.specialty})` : `Dr. ${d.name} (${d.specialty})`,
              raw: { ...d, user_id: match.user_id },
            });
          }
        }

        // Log all attempts
        const matched = normalized.filter(u => u.role === 'doctor');
        console.log(`Doctor matches: ${matched.length}/${doctors.length}`);
      }

      if (nursesRes.data) {
        const nurses = nursesRes.data;
        console.log("Processing nurses - RAW DATA:", JSON.stringify({
          total: nurses.length,
          available: nurses.map(n => ({
            id: n.id,
            name: n.name,
            nurse_no: n.nurse_no,
            department: n.department
          }))
        }, null, 2));
        
        for (const n of nurses) {
          // Log each nurse we're trying to match with detailed comparison
          const matchAttempt = {
            nurse: {
              name: n.name,
              nurse_no: n.nurse_no
            },
            userRoles: userRoles.map(ur => ({
              role: ur.role,
              account_number: ur.account_number,
              patient_number: ur.patient_number
            })),
            matchConditions: {
              byNurseNo: userRoles.some(ur => ur.account_number === n.nurse_no),
              byName: userRoles.some(ur => ur.account_number === n.name),
              byPatientNumber: userRoles.some(ur => ur.patient_number === n.nurse_no)
            }
          };
          console.log("Nurse match attempt - RAW DATA:", JSON.stringify(matchAttempt, null, 2));

          // Try to find matching user_role in multiple ways
          console.log("Trying nurse match with:", {
            name: n.name,
            nurse_no: n.nurse_no,
            // Try with and without 'N' prefix
            possibleNumbers: [
              n.nurse_no,
              n.nurse_no.replace(/^N/, ''),
              n.nurse_no.toLowerCase(),
              n.nurse_no.toUpperCase()
            ]
          });

            // Use shared matcher (unit-testable helper)
            const matchResult = matchNurse({ nurse_no: n.nurse_no, name: n.name }, authUsers, userRoles);
            if (matchResult?.userId) {
              console.log("Matched nurse using:", matchResult.source, {
                nurse_name: n.name,
                nurse_no: n.nurse_no,
                user_id: matchResult.userId,
                via: matchResult.roleMatch ?? null
              });
              normalized.push({
                user_id: matchResult.userId,
                role: "nurse",
                display: `${n.name} (${n.nurse_no}) - ${n.department}`,
                raw: { ...n, user_id: matchResult.userId },
              });
            }
        }

        // Log all attempts
        const matched = normalized.filter(u => u.role === 'nurse');
        console.log(`Nurse matches: ${matched.length}/${nurses.length}`);
      }

      // Log the final normalized results for debugging
      console.log("Normalized users:", {
        total: normalized.length,
        byRole: {
          doctors: normalized.filter(u => u.role === "doctor").length,
          nurses: normalized.filter(u => u.role === "nurse").length,
          medtechs: normalized.filter(u => u.role === "medtech").length,
          radtechs: normalized.filter(u => u.role === "radtech").length
        }
      });

      // Filter out any remaining entries without auth user id (defensive)
      const withAuthId = normalized.filter((u) => !!u.user_id) as NormalizedUser[];
      setUsers(withAuthId);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("fetchUsers error", err);
      toast.error(sanitizeError(err as any));
    }
  }

  async function fetchMessages() {
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
      // eslint-disable-next-line no-console
      console.error("fetchMessages error", err);
    }
  }

  async function sendMessage() {
    if (!messageText?.trim()) return toast.error("Please enter a message");
    if (!selectedRecipient) return toast.error("Please select a recipient");
    if (!currentUserId) return toast.error("Unable to determine current user");

    // Defensive: ensure selectedRecipient is present in users and has a valid auth id
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
      setSelectedRecipient("");
      fetchMessages();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("sendMessage error", err);
      toast.error(sanitizeError(err as any));
    }
  }

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const term = searchTerm.toLowerCase();
      return (
        m.content.toLowerCase().includes(term) || (m.subject && m.subject.toLowerCase().includes(term))
      );
    });
  }, [messages, searchTerm]);

  const getUserLabel = (userId: string) => users.find((u) => u.user_id === userId)?.display || "Unknown";

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
              <Input placeholder="Search messages..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredMessages.map((message) => (
                <div key={message.id} className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${selectedMessage?.id === message.id ? "bg-muted" : ""}`} onClick={() => setSelectedMessage(message)}>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{getUserLabel(message.sender_id === currentUserId ? message.recipient_id : message.sender_id).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm truncate">{getUserLabel(message.sender_id === currentUserId ? message.recipient_id : message.sender_id)}</p>
                        {!message.read && message.recipient_id === currentUserId && <Badge variant="default" className="text-xs">New</Badge>}
                      </div>
                      {message.subject && <p className="text-sm font-medium truncate">{message.subject}</p>}
                      <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(message.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{selectedMessage ? getUserLabel(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id) : "New Message"}</CardTitle>
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
                              <SelectItem key={user.user_id} value={user.user_id!}>{user.display}</SelectItem>
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
                  <Button className="self-end" onClick={sendMessage}><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  {selectedMessage.subject && <p className="font-semibold text-sm mb-2">Subject: {selectedMessage.subject}</p>}
                  <p className="text-sm">{selectedMessage.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <Input placeholder="Subject (optional)" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} />
                  <div className="flex gap-2">
                    <Textarea placeholder="Type your reply..." value={messageText} onChange={(e) => setMessageText(e.target.value)} className="min-h-[80px]" />
                    <Button className="self-end" onClick={() => { setSelectedRecipient(selectedMessage.sender_id === currentUserId ? selectedMessage.recipient_id : selectedMessage.sender_id); sendMessage(); }}><Send className="h-4 w-4" /></Button>
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