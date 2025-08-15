import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { QuickLinksClient } from "./quick-links-client"

export default async function QuickLinksPage() {
  let supabase
  try {
    supabase = createClient()

    // Check if supabase client is properly initialized
    if (!supabase || !supabase.auth) {
      console.log("Supabase client not properly initialized, using demo mode")
      return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
    }
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      redirect("/auth")
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    // Get user's quick links
    let initialQuickLinks = []
    try {
      const { data: quickLinks } = await supabase
        .from("quick_links")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      initialQuickLinks = quickLinks || []
    } catch (error) {
      console.log("Quick links table not found, using demo mode")
    }

    return <QuickLinksClient user={user} profile={profile} initialQuickLinks={initialQuickLinks} />
  } catch (error) {
    console.error("Error loading quick links page:", error)
    return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
  }
}
