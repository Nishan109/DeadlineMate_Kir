import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Call the stored procedure to generate notifications
    const { error } = await supabase.rpc("generate_deadline_notifications")

    if (error) {
      console.error("Error generating notifications:", error)
      return NextResponse.json({ error: "Failed to generate notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Notifications generated successfully" })
  } catch (error) {
    console.error("Error in notification generation API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  // Allow GET requests to trigger notification generation (useful for cron jobs)
  return POST()
}
