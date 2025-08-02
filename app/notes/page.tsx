import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import NotesClient from "./notes-client"

export default async function NotesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  // Fetch notes
  const { data: notes, error: notesError } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })

  if (notesError) {
    console.error("Error fetching notes:", notesError)
  }

  // Fetch deadlines for linking
  const { data: deadlines, error: deadlinesError } = await supabase
    .from("deadlines")
    .select("id, title")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true })

  if (deadlinesError) {
    console.error("Error fetching deadlines:", deadlinesError)
  }

  return <NotesClient user={user} initialNotes={notes || []} deadlines={deadlines || []} isDemoMode={false} />
}
