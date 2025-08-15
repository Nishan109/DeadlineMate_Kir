"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  ExternalLink,
  Share2,
  Edit,
  Trash2,
  Eye,
  Calendar,
  BarChart3,
  LinkIcon,
  Home,
  Users,
  StickyNote,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AddQuickLinkDialog } from "@/components/quick-links/add-quick-link-dialog"
import { EditQuickLinkDialog } from "@/components/quick-links/edit-quick-link-dialog"
import { DeleteQuickLinkDialog } from "@/components/quick-links/delete-quick-link-dialog"
import { ShareQuickLinkDialog } from "@/components/quick-links/share-quick-link-dialog"

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
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedQuickLink, setSelectedQuickLink] = useState<QuickLink | null>(null)

  const router = useRouter()
  const supabase = createClient()

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
      description: "Code repository",
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
      description: "AI assistant by Google",
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
      description: "AI chatbot by OpenAI",
      category: "ai",
      color: "green",
      is_public: true,
      click_count: 156,
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

  const handleShareClick = (link: QuickLink) => {
    setSelectedQuickLink(link)
    setIsShareDialogOpen(true)
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      search: "bg-blue-100 text-blue-800",
      development: "bg-green-100 text-green-800",
      entertainment: "bg-red-100 text-red-800",
      work: "bg-purple-100 text-purple-800",
      social: "bg-pink-100 text-pink-800",
      general: "bg-gray-100 text-gray-800",
      personal: "bg-indigo-100 text-indigo-800",
      education: "bg-yellow-100 text-yellow-800",
      productivity: "bg-cyan-100 text-cyan-800",
      ai: "bg-violet-100 text-violet-800",
    }
    return colors[category] || colors.general
  }

  const getColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: "border-l-blue-500",
      green: "border-l-green-500",
      red: "border-l-red-500",
      purple: "border-l-purple-500",
      pink: "border-l-pink-500",
      gray: "border-l-gray-500",
      yellow: "border-l-yellow-500",
      orange: "border-l-orange-500",
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <LinkIcon className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">DeadlineMate</span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Home className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Dashboard
              </Link>
              <Link
                href="/calendar"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Calendar className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Calendar
              </Link>
              <Link
                href="/timetable"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Calendar className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Time Table
              </Link>
              <Link
                href="/analytics"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <BarChart3 className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Analytics
              </Link>
              <Link
                href="/notes"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <StickyNote className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Notes
              </Link>
              <Link
                href="/quick-links"
                className="bg-green-100 text-green-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <LinkIcon className="text-green-500 mr-3 flex-shrink-0 h-5 w-5" />
                Quick Links
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md"
              >
                <Users className="text-gray-400 group-hover:text-gray-500 mr-3 flex-shrink-0 h-5 w-5" />
                Profile
              </Link>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-4 sm:py-6">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8 flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Links</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your personal links and share them with others</p>
                  </div>
                  <div className="flex justify-start sm:justify-end">
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Link
                    </Button>
                  </div>
                </div>

                {/* Search and filters */}
                <div className="mb-4 sm:mb-6 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search links..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 sm:h-9"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full min-w-max">
                      <TabsList className="grid grid-flow-col auto-cols-max gap-1 w-full">
                        {categories.slice(0, 8).map((category) => (
                          <TabsTrigger
                            key={category}
                            value={category}
                            className="capitalize whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm"
                          >
                            {category}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                {/* Quick Links Grid */}
                {filteredQuickLinks.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <LinkIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No quick links</h3>
                    <p className="mt-1 text-sm text-gray-500 px-4">Get started by creating your first quick link.</p>
                    <div className="mt-4 sm:mt-6">
                      <Button onClick={() => setIsAddDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Enhanced responsive grid with better mobile spacing */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredQuickLinks.map((link) => (
                      <Card
                        key={link.id}
                        className={`hover:shadow-md transition-shadow border-l-4 ${getColorClass(link.color)}`}
                      >
                        <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg font-medium text-gray-900 truncate">
                                {link.title}
                              </CardTitle>
                              <CardDescription className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">
                                {link.description || link.url}
                              </CardDescription>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                              {link.is_public && (
                                <Badge variant="secondary" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                          <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <Badge className={`text-xs ${getCategoryColor(link.category)}`}>{link.category}</Badge>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Eye className="h-3 w-3" />
                              <span>{link.click_count}</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleLinkClick(link)}
                              className="flex-1 bg-green-600 hover:bg-green-700 h-8 sm:h-9"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open
                            </Button>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShareClick(link)}
                                className="flex-1 sm:flex-none h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Share2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditClick(link)}
                                className="flex-1 sm:flex-none h-8 sm:h-9 px-2 sm:px-3"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent flex-1 sm:flex-none h-8 sm:h-9 px-2 sm:px-3"
                                onClick={() => handleDeleteClick(link)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

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

      <ShareQuickLinkDialog
        isOpen={isShareDialogOpen}
        onClose={() => {
          setIsShareDialogOpen(false)
          setSelectedQuickLink(null)
        }}
        quickLink={selectedQuickLink}
        isDemoMode={isDemo}
      />
    </div>
  )
}

export default QuickLinksClient
