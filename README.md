# MangaVerse

A modern, full-featured manga and manhwa reading platform built with Next.js 15, TypeScript, Prisma, and Tailwind CSS.

## 🚀 Features

- **User Management**: Registration, authentication, profile settings with NextAuth
- **Content Discovery**: Browse, search, filter, and sort manga by genre, type, status
- **Series Details**: Comprehensive series pages with cover, description, stats, chapter lists
- **Advanced Reader**: Multiple reading modes (vertical, paged), customizable interface, keyboard shortcuts
- **Social Features**: Follow series, rate and review, comment with nested replies and likes
- **Library Management**: Reading history, continue reading, followed series
- **Notifications**: Real-time notifications for chapter updates, comments, follows
- **Admin & Creator Dashboards**: Content management, moderation, analytics
- **Security**: RBAC, rate limiting, input validation, ownership checks
- **SEO**: Optimized metadata, OpenGraph, sitemap support

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev), PostgreSQL (production-ready)
- **Authentication**: NextAuth.js with credentials provider
- **Validation**: Zod schemas
- **Image Processing**: Sharp

## 📋 Prerequisites

- Node.js 18+ or Bun 1+
- npm, yarn, or bun package manager

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd mangaverse
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   bun run db:push
   ```

5. Generate Prisma client:
   ```bash
   bun run db:generate
   ```

6. Seed the database (optional, for demo data):
   ```bash
   bun run db:seed
   ```

7. Start the development server:
   ```bash
   bun run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-min-32-characters"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Environment Variable Descriptions

- `DATABASE_URL`: Connection string for your database. SQLite for development, PostgreSQL for production
- `NEXTAUTH_URL`: The URL where your app is running
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js JWT tokens. Generate with `openssl rand -base64 32`
- `NEXT_PUBLIC_APP_URL`: Public URL for your app (used for redirects, callbacks)

## 👤 Demo Accounts

After running the seed script, you can use these accounts to test:

### Admin Account
- **Email**: `admin@mangaverse.com`
- **Password**: `Admin123!`
- **Role**: Full access to admin dashboard and all platform features

### Creator Account
- **Email**: `creator@mangaverse.com`
- **Password**: `Creator123!`
- **Role**: Access to creator dashboard to manage series and chapters

### User Account
- **Email**: `user@mangaverse.com`
- **Password**: `User123!`
- **Role**: Regular user with reading, following, and commenting capabilities

## 📁 Project Structure

```
mangaverse/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding script
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── series/[slug]/    # Series detail pages
│   │   ├── reader/           # Reader pages
│   │   ├── discover/         # Discovery page
│   │   ├── library/          # User library
│   │   └── profile/          # User profile & settings
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Header, Footer
│   │   ├── series/           # Series-related components
│   │   └── user/             # User-related components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── auth-utils.ts    # Authentication utilities
│   │   ├── db.ts            # Prisma client
│   │   ├── validations.ts    # Zod schemas
│   │   ├── rate-limit.ts     # Rate limiting
│   │   └── storage.ts       # Image storage
│   └── types/
│       └── next-auth.d.ts    # NextAuth TypeScript types
├── public/
│   └── uploads/              # User uploaded content
├── .env.example              # Environment variables template
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## 🔧 Database Schema

The platform uses Prisma ORM with the following main models:

- **User**: User accounts, profiles, roles, and settings
- **Series**: Manga/manhwa series with metadata, stats, and genres
- **Chapter**: Series chapters with publication status and scheduling
- **Page**: Individual manga pages with order and dimensions
- **Genre**: Content categories
- **Tag**: Content tags for more granular filtering
- **Follow**: User following relationships
- **ReadingProgress**: Track user reading position and completion
- **History**: User reading history
- **Comment**: Comments with nested replies and likes
- **Rating**: Series ratings (1-5 stars)
- **Review**: User-written series reviews
- **Notification**: User notifications
- **Report**: Content reporting and moderation
- **AuditLog**: Track all important actions
- **ReaderPreferences**: User reader customization options

## 🎨 UI Components

The project uses shadcn/ui components built on Radix UI primitives:

- Layout: Header, Footer, Navigation
- Forms: Input, Textarea, Select, Slider, Switch
- Data Display: Card, Badge, Avatar, Tabs, Separator
- Feedback: Button, Dialog, Toast, Alert
- Navigation: Pagination, Breadcrumbs

## 🚀 API Routes

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login (via NextAuth)
- `GET /api/users/me` - Get current user info

### Series
- `GET /api/series` - List series with filters and pagination
- `GET /api/series/[slug]` - Get series details
- `POST /api/series` - Create new series (creator+)
- `PATCH /api/series/[slug]` - Update series (owner only)
- `DELETE /api/series/[slug]` - Delete series (owner only)

### Chapters & Pages
- `GET /api/chapters` - List chapters
- `GET /api/chapters/[id]` - Get chapter details with pages
- `POST /api/chapters` - Create new chapter (creator+)
- `POST /api/chapters/[id]/pages` - Upload pages to chapter (creator+)

### Comments
- `GET /api/comments` - List comments for a chapter
- `POST /api/comments` - Create comment (auth+)
- `PATCH /api/comments/[id]` - Update comment (owner only)
- `DELETE /api/comments/[id]` - Delete comment (owner/mod)
- `POST /api/comments/[id]/like` - Like/unlike comment (auth+)

### Ratings
- `GET /api/ratings` - Get ratings for a series
- `POST /api/ratings` - Create/update rating (auth+)
- `DELETE /api/ratings` - Remove rating (owner)

### Reviews
- `GET /api/reviews` - Get reviews for a series
- `POST /api/reviews` - Create review (auth+)
- `PATCH /api/reviews/[id]` - Update review (owner)
- `DELETE /api/reviews/[id]` - Delete review (owner/mod)

### Follows
- `GET /api/follows` - Get user's followed series
- `POST /api/follows` - Follow a series (auth+)
- `DELETE /api/follows` - Unfollow a series (auth+)

### Reading Progress
- `GET /api/progress` - Get reading progress
- `POST /api/progress` - Update reading progress (auth+)

### Notifications
- `GET /api/notifications` - Get user notifications (auth+)
- `PATCH /api/notifications` - Mark as read (auth+)
- `DELETE /api/notifications` - Clear old notifications (auth+)

### Reports
- `GET /api/reports` - Get reports (mod/admin)
- `POST /api/reports` - Create report (auth+)
- `PATCH /api/reports/[id]` - Update report status (mod/admin)

## 🔐 Security Features

- **Role-Based Access Control (RBAC)**: ADMIN > MODERATOR > CREATOR > USER
- **Rate Limiting**: Different limits for different endpoints
- **Input Validation**: All inputs validated with Zod schemas
- **CSRF Protection**: Built-in NextAuth.js CSRF protection
- **Password Hashing**: bcryptjs for secure password storage
- **Ownership Checks**: Users can only modify their own content
- **Audit Logging**: All important actions are logged

## 📝 Development

### Database Migrations

```bash
# Create a new migration
bun prisma migrate dev --name migration_name

# Reset database and apply all migrations
bun prisma migrate reset
```

### Database Seeding

```bash
# Seed database with demo data
bun run db:seed
```

### Code Quality

```bash
# Run linter
bun run lint

# Type check
bun tsc --noEmit
```

## 🚢 Deployment

### Build

```bash
bun run build
```

### Production Server

```bash
bun start
```

### Environment Setup for Production

1. Use PostgreSQL instead of SQLite
2. Set a strong `NEXTAUTH_SECRET`
3. Configure `DATABASE_URL` for PostgreSQL
4. Set up CDN for image storage
5. Enable HTTPS
6. Configure allowed origins if needed

## 📱 Features

### Reader
- **Vertical Scroll Mode**: Continuous scrolling through pages
- **Paged Mode**: Scroll-snap between pages
- **Customization**: Background color, page gap, image quality
- **Keyboard Shortcuts**: Arrow keys, Space, H, S, F, A, Esc
- **Progress Tracking**: Auto-save reading position
- **Auto-Scroll**: Automatic scrolling (toggle with A)

### User Management
- **Profile**: Custom avatar, bio, username
- **Settings**: Reader preferences, privacy settings, notifications
- **Library**: Followed series, reading history, continue reading
- **Account**: Password change, account deletion

### Social
- **Comments**: Nested replies, likes, spoiler tags
- **Reviews**: Detailed reviews with ratings
- **Follows**: Follow/unfollow series
- **Ratings**: 1-5 star ratings for series

## 🔧 Configuration

### Next.js Configuration

Edit `next.config.ts` to customize:
- Image domains
- Rewrites
- Headers
- Experimental features

### Tailwind CSS

Edit `tailwind.config.ts` to customize:
- Color palette
- Font family
- Custom components
- Animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, questions, or suggestions, please contact:
- Email: support@mangaverse.com
- Discord: [Discord Server URL]
- GitHub Issues: [Repository Issues URL]

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible components
- [Lucide](https://lucide.dev/) - Icon library

---

**Built with ❤️ by the MangaVerse Team**
