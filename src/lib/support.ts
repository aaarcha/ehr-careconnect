import { supabase } from "@/integrations/supabase/client";

export async function createSupportTicket(userId: string | null, subject: string, category: string, description: string) {
  if (!userId) {
    throw new Error("User must be signed in to create a support ticket.");
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert([
      {
        user_id: userId,
        subject,
        category,
        description,
      },
    ])
    .select("id, status, created_at")
    .single();

  if (error) throw error;
  return data;
}