"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, ExternalLink, Edit, Trash2, Eye, LinkIcon, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AddQuickLinkDialog } from "@/components/quick-links/add-quick-link-dialog"
import { EditQuickLinkDialog } from "@/components/quick-links/edit-quick-link-dialog"
import { DeleteQuickLinkDialog } from "@/components/quick-links/delete-quick-link-dialog"

interface QuickLink {
  id: string
  title: string
  url: string
  description?: string
  category: string
  color: string
  is_public: boolean
  click_count: number
  created_at: string
  updated_at: string
}

interface QuickLinksClientProps {
  user: any
  profile: any
  initialQuickLinks: QuickLink[]
}

export function QuickLinksClient({ user, profile, initialQuickLinks }: QuickLinksClientProps) {
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(initialQuickLinks)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isDemo, setIsDemo] = useState(!user)
  const [loading, setLoading] = useState(false)

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedQuickLink, setSelectedQuickLink] = useState<QuickLink | null>(null)

  const router = useRouter()
  const supabase = createClient()

  // Demo data for when user is not authenticated or database is not available
  const demoQuickLinks: QuickLink[] = [
    {
      id: "demo-1",
      title: "Google Drive",
      url: "https://drive.google.com",
      description: "Cloud storage and file sharing",
      category: "productivity",
      color: "blue",
      is_public: false,
      click_count: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-2",
      title: "GitHub",
      url: "https://github.com",
      description: "Code repository and collaboration",
      category: "development",
      color: "gray",
      is_public: true,
      click_count: 32,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-3",
      title: "Gemini",
      url: "https://gemini.google.com",
      description: "Google's AI assistant",
      category: "ai",
      color: "purple",
      is_public: false,
      click_count: 78,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "demo-4",
      title: "ChatGPT",
      url: "https://chat.openai.com",
      description: "OpenAI's conversational AI",
      category: "ai",
      color: "green",
      is_public: false,
      click_count: 92,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    if (isDemo) {
      setQuickLinks(demoQuickLinks)
    } else if (initialQuickLinks.length === 0) {
      // If user is authenticated but no links, show empty state
      setQuickLinks([])
    }
  }, [isDemo, initialQuickLinks])

  // Filter quick links based on search and category
  const filteredQuickLinks = quickLinks.filter((link) => {
    const matchesSearch =
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || link.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(quickLinks.map((link) => link.category)))]

  const handleLinkClick = async (link: QuickLink) => {
    // Track click if not in demo mode
    if (!isDemo && user) {
      try {
        await supabase.from("quick_link_clicks").insert({
          quick_link_id: link.id,
          user_id: user.id,
          clicked_at: new Date().toISOString(),
        })
      } catch (error) {
        console.log("Could not track click:", error)
      }
    }

    // Open link in new tab
    window.open(link.url, "_blank")
  }

  // Dialog handlers
  const handleAddQuickLink = (newQuickLink: QuickLink) => {
    setQuickLinks((prev) => [newQuickLink, ...prev])
  }

  const handleUpdateQuickLink = (updatedQuickLink: QuickLink) => {
    setQuickLinks((prev) => prev.map((link) => (link.id === updatedQuickLink.id ? updatedQuickLink : link)))
  }

  const handleDeleteQuickLink = (quickLinkId: string) => {
    setQuickLinks((prev) => prev.filter((link) => link.id !== quickLinkId))
  }

  const handleEditClick = (link: QuickLink) => {
    setSelectedQuickLink(link)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (link: QuickLink) => {
    setSelectedQuickLink(link)
    setIsDeleteDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      productivity: "bg-amber-100 text-amber-800",
      education: "bg-amber-100 text-amber-800",
      development: "bg-blue-100 text-blue-800",
      ai: "bg-blue-100 text-blue-800",
      search: "bg-blue-100 text-blue-800",
      general: "bg-gray-100 text-gray-800",
      personal: "bg-gray-100 text-gray-800",
      work: "bg-gray-100 text-gray-800",
      social: "bg-blue-100 text-blue-800",
      entertainment: "bg-amber-100 text-amber-800",
    }
    return colors[category] || colors.general
  }

  const getColorClass = (color: string) => {
    const map: { [key: string]: string } = {
      blue: "border-l-blue-500",
      green: "border-l-green-600",
      amber: "border-l-amber-500",
      gray: "border-l-gray-400",
      red: "border-l-red-500",
    }
    // normalize incoming colors to our palette
    if (["development", "ai", "search", "social"].includes(color)) return map.blue
    if (["productivity", "education", "entertainment", "yellow", "orange", "amber"].includes(color)) return map.amber
    if (["gray", "general", "personal", "work"].includes(color)) return map.gray
    if (["red"].includes(color)) return map.red
    return map.green
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content */}
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Back to Dashboard (mobile) */}
            <div className="mb-4 lg:hidden">
              <Link href="/dashboard">
                <Button variant="outline" className="flex items-center bg-transparent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <div className="hidden lg:block">
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="flex items-center bg-transparent">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quick Links</h1>
                  <p className="mt-1 text-sm text-gray-500">Manage your personal links and share them with others</p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sticky top-0 z-[1] bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 py-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search links..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 focus-visible:ring-2 focus-visible:ring-green-600"
                    aria-label="Search quick links"
                  />
                </div>
              </div>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
                <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-white shadow-sm border rounded-md">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="capitalize px-3 py-1.5 text-sm whitespace-nowrap data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
                      aria-label={`Filter by ${category}`}
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Quick Links Grid */}
            {filteredQuickLinks.length === 0 ? (
              <div className="text-center py-12">
                <LinkIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No quick links</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first quick link.</p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredQuickLinks.map((link) => (
                  <Card
                    key={link.id}
                    className={`group hover:shadow-lg transition-shadow border-l-4 ${getColorClass(
                      link.color || link.category,
                    )} bg-white`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-[15px] font-semibold text-gray-900 truncate">
                            {link.title}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {link.description || link.url}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {link.is_public ? (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs ${getCategoryColor(link.category)}`}>{link.category}</Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-500" aria-label="Total clicks">
                          <Eye className="h-3 w-3" />
                          <span>{link.click_count}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => handleLinkClick(link)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          aria-label={`Open ${link.title}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(link)}
                          aria-label={`Edit ${link.title}`}
                          className="bg-white"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 bg-white"
                          onClick={() => handleDeleteClick(link)}
                          aria-label={`Delete ${link.title}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <AddQuickLinkDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddQuickLink}
        userId={user?.id || "demo-user"}
        isDemoMode={isDemo}
      />
      <EditQuickLinkDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedQuickLink(null)
        }}
        onUpdate={handleUpdateQuickLink}
        quickLink={selectedQuickLink}
        isDemoMode={isDemo}
      />
      <DeleteQuickLinkDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedQuickLink(null)
        }}
        onDelete={handleDeleteQuickLink}
        quickLink={selectedQuickLink}
        isDemoMode={isDemo}
      />
    </div>
  )
}

export default QuickLinksClient
