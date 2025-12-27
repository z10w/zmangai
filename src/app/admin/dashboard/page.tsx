import { requireAdmin } from '@/lib/auth-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  BookOpen,
  BarChart3,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Shield,
  Settings,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { db } from '@/lib/db'

async function getAdminDashboardData() {
  const [stats, recentActivity, recentReports] = await Promise.all([
    // Platform statistics
    Promise.all([
      db.user.count(),
      db.series.count(),
      db.chapter.count(),
      db.comment.count(),
      db.series.aggregate({ _sum: { views: true } }),
    ]),

    // Recent activity
    Promise.all([
      db.series.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.chapter.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      db.comment.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]),

    // Pending reports
    db.report.findMany({
      where: { status: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    }),
  ])

  return {
    stats: {
      totalUsers: stats[0],
      totalSeries: stats[1],
      totalChapters: stats[2],
      totalComments: stats[3],
      totalViews: stats[4]._sum.views || 0,
      recentSeries: stats[5],
      recentChapters: stats[6],
      recentComments: stats[7],
    },
    recentActivity: {
      newSeries: stats[5],
      newChapters: stats[6],
      newComments: stats[7],
    },
    recentReports,
  }
}

export default async function AdminDashboard() {
  await requireAdmin()
  const { stats, recentActivity, recentReports } = await getAdminDashboardData()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Page Header */}
      <section className="border-b bg-muted/50">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Platform overview and management
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin/users">
                <Button variant="outline">
                  <Users className="mr-2 h-5 w-5" />
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/content">
                <Button variant="outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Manage Content
                </Button>
              </Link>
              <Link href="/admin/reports">
                <Button variant="outline">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Reports ({recentReports.length})
                </Button>
              </Link>
              <Link href="/admin/settings">
                <Button variant="outline">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="container px-4 py-8">
          {/* Overview Statistics */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Overview</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <Users className="h-8 w-8 text-blue-500" />
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Registered users
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Series
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-purple-500" />
                    {stats.totalSeries.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Active series
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Chapters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8 text-green-500" />
                    {stats.totalChapters.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Published chapters
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold flex items-center gap-2">
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                    {stats.totalViews.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Total views across platform
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Recent Activity (7 Days)</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>New Series</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-500">
                    {stats.recentSeries}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Series added this week
                  </div>
                  <Link href="/admin/content?tab=series" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-500">
                    {stats.recentChapters}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Chapters published this week
                  </div>
                  <Link href="/admin/content?tab=chapters" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-500">
                    {stats.recentComments}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Comments posted this week
                  </div>
                  <Link href="/admin/content?tab=comments" className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View All
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Management Sections */}
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full md:max-w-lg grid-cols-3">
              <TabsTrigger value="reports">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Reports ({recentReports.length})
                </div>
              </TabsTrigger>
              <TabsTrigger value="users">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </div>
              </TabsTrigger>
              <TabsTrigger value="content">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Content
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Reports</CardTitle>
                    <Link href="/admin/reports">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentReports.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No pending reports</h3>
                      <p className="text-muted-foreground">
                        All reports have been reviewed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {report.type}
                                </Badge>
                                <span className="font-semibold">{report.reason}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <Link href={`/admin/reports/${report.id}`}>
                              <Button variant="outline" size="sm">
                                Review
                              </Button>
                            </Link>
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground">
                              {report.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>Reported by: {report.reporter.username}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {recentReports.length > 0 && (
                    <div className="mt-4 text-center">
                      <Link href="/admin/reports">
                        <Button>View All Reports</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/admin/users">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Users</h3>
                      <p className="text-sm text-muted-foreground">
                        View, edit, and manage user accounts
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Users
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/users/new">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <Users className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Create User</h3>
                      <p className="text-sm text-muted-foreground">
                        Create new admin, moderator, or creator accounts
                      </p>
                      <Button className="mt-4">
                        <Users className="mr-2 h-4 w-4" />
                        Create User
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Link href="/admin/roles">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <Shield className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Roles</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure user permissions and access levels
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Roles
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/audit">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <FileText className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Audit Logs</h3>
                      <p className="text-sm text-muted-foreground">
                        View system activity and action logs
                      </p>
                      <Button variant="outline" className="mt-4">
                        View Logs
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Link href="/admin/content?tab=series">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Series</h3>
                      <p className="text-sm text-muted-foreground">
                        Edit, moderate, or remove series
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Series
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/content?tab=chapters">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <FileText className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Chapters</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and moderate chapter content
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Chapters
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/content?tab=comments">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <MessageSquare className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Comments</h3>
                      <p className="text-sm text-muted-foreground">
                        Moderate and manage user comments
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Comments
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Link href="/admin/content?tag=reviews">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <BarChart3 className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Manage Reviews</h3>
                      <p className="text-sm text-muted-foreground">
                        Moderate and manage series reviews
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Reviews
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/content?tag=reports">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="py-8 text-center">
                      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                      <h3 className="text-xl font-semibold mb-1">Content Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Review and resolve content reports
                      </p>
                      <Button variant="outline" className="mt-4">
                        Go to Reports
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
