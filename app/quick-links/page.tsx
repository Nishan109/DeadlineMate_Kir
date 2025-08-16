import { createClient } from "@/utils/supabase/server"
import { QuickLinksClient } from "./quick-links-client"

export default async function QuickLinksPage() {
  try {
    const supabase = await createClient()

    if (!supabase || !supabase.auth) {
      console.log("Supabase client not properly initialized, using demo mode")
      return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
    }

    // Try to get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.log("Authentication error:", userError.message)
      // Don't redirect, just use demo mode
      return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
    }

    if (!user) {
      console.log("No authenticated user, using demo mode")
      return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
    }

    // User is authenticated, try to get their data
    let profile = null
    let initialQuickLinks = []

    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError && !profileError.message?.includes("Demo mode")) {
        console.log("Profile fetch error:", profileError.message)
      } else {
        profile = profileData
      }

      // Get user's quick links
      const { data: quickLinks, error: quickLinksError } = await supabase
        .from("quick_links")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })

      if (quickLinksError) {
        console.log("Quick links fetch error:", quickLinksError.message)
        // If it's a demo mode error, that's expected
        if (!quickLinksError.message?.includes("Demo mode")) {
          console.error("Unexpected database error:", quickLinksError)
        }
      } else {
        initialQuickLinks = quickLinks || []
      }
    } catch (error) {
      console.log("Error fetching user data:", error)
    }

    return <QuickLinksClient user={user} profile={profile} initialQuickLinks={initialQuickLinks} />
  } catch (error) {
    console.error("Error loading quick links page:", error)
    return <QuickLinksClient user={null} profile={null} initialQuickLinks={[]} />
  }
}
