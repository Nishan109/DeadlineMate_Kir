import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  try {
    // Check if we're in a preview environment without proper Supabase config
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn("⚠️ Supabase environment variables not found, returning mock client")

      // Return a mock client for preview environments
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signInWithPassword: () =>
            Promise.resolve({ data: { user: null }, error: { message: "Demo mode - authentication disabled" } }),
          signUp: () =>
            Promise.resolve({ data: { user: null }, error: { message: "Demo mode - authentication disabled" } }),
          signOut: () => Promise.resolve({ error: null }),
        },
        from: (table: string) => ({
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              order: (column: string, options?: any) => Promise.resolve({ data: [], error: null }),
              single: () =>
                Promise.resolve({ data: null, error: { message: "Demo mode - database disabled", code: "DEMO_MODE" } }),
              limit: (count: number) => Promise.resolve({ data: [], error: null }),
            }),
            single: () =>
              Promise.resolve({ data: null, error: { message: "Demo mode - database disabled", code: "DEMO_MODE" } }),
            limit: (count: number) => Promise.resolve({ data: [], error: null }),
          }),
          insert: (values: any) => ({
            select: (columns?: string) => ({
              single: () =>
                Promise.resolve({ data: null, error: { message: "Demo mode - database disabled", code: "DEMO_MODE" } }),
            }),
          }),
          update: (values: any) => ({
            eq: (column: string, value: any) =>
              Promise.resolve({ data: null, error: { message: "Demo mode - database disabled", code: "DEMO_MODE" } }),
          }),
        }),
      } as any
    }

    console.log("🔧 Initializing Supabase server client...")
    console.log("📍 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...")
    console.log("🔑 Anon Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    let cookieStore
    try {
      cookieStore = await cookies()
    } catch (cookieError) {
      console.warn("⚠️ Failed to access cookies, this might be a client-side call:", cookieError)
      // Return a mock client when cookies are not available
      return {
        auth: {
          getUser: () =>
            Promise.resolve({ data: { user: null }, error: { message: "Server context required for authentication" } }),
          signInWithPassword: () =>
            Promise.resolve({ data: { user: null }, error: { message: "Server context required for authentication" } }),
          signUp: () =>
            Promise.resolve({ data: { user: null }, error: { message: "Server context required for authentication" } }),
          signOut: () => Promise.resolve({ error: null }),
        },
        from: (table: string) => ({
          select: (columns?: string) => ({
            eq: (column: string, value: any) => ({
              order: (column: string, options?: any) =>
                Promise.resolve({
                  data: [],
                  error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
                }),
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
                }),
              limit: (count: number) =>
                Promise.resolve({
                  data: [],
                  error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
                }),
            }),
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
              }),
            limit: (count: number) =>
              Promise.resolve({
                data: [],
                error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
              }),
          }),
          insert: (values: any) => ({
            select: (columns?: string) => ({
              single: () =>
                Promise.resolve({
                  data: null,
                  error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
                }),
            }),
          }),
          update: (values: any) => ({
            eq: (column: string, value: any) =>
              Promise.resolve({
                data: null,
                error: { message: "Server context required", code: "SERVER_CONTEXT_ERROR" },
              }),
          }),
        }),
      } as any
    }

    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn("⚠️ Cookie setting failed (this is normal in Server Components):", error)
            }
          },
        },
      },
    )

    // Validate that the client was created successfully
    if (!client) {
      throw new Error("Failed to create Supabase client - client is null")
    }

    // Validate that the client has the expected methods
    if (typeof client.from !== "function") {
      throw new Error("Invalid Supabase client - missing 'from' method")
    }

    console.log("✅ Supabase server client initialized successfully")
    return client
  } catch (error) {
    console.error("❌ Failed to initialize Supabase server client:", error)

    // Return a mock client that will show proper error messages
    return {
      auth: {
        getUser: () =>
          Promise.resolve({
            data: { user: null },
            error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
          }),
        signInWithPassword: () =>
          Promise.resolve({
            data: { user: null },
            error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
          }),
        signUp: () =>
          Promise.resolve({
            data: { user: null },
            error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
          }),
        signOut: () => Promise.resolve({ error: null }),
      },
      from: (table: string) => ({
        select: (columns?: string) => ({
          eq: (column: string, value: any) => ({
            order: (column: string, options?: any) =>
              Promise.resolve({
                data: [],
                error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
              }),
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
              }),
            limit: (count: number) =>
              Promise.resolve({
                data: [],
                error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
              }),
          }),
          single: () =>
            Promise.resolve({
              data: null,
              error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
            }),
          limit: (count: number) =>
            Promise.resolve({
              data: [],
              error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
            }),
        }),
        insert: (values: any) => ({
          select: (columns?: string) => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
              }),
          }),
        }),
        update: (values: any) => ({
          eq: (column: string, value: any) =>
            Promise.resolve({
              data: null,
              error: { message: "Supabase client initialization failed", code: "CLIENT_INIT_ERROR" },
            }),
        }),
      }),
    } as any
  }
}
