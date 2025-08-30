# Teodor Admin Panel Setup Guide

## ✅ Features Implemented

### 🎨 Design System
- **WHOOP-inspired dark theme** matching the teodor-app design
- Custom color palette (green, red, yellow, blue, purple, cyan)
- Responsive layout with mobile support
- Beautiful card components with elevation
- Consistent typography using Inter font

### 🔐 Authentication
- JWT-based admin authentication
- Password-protected login page
- Session management with secure cookies (12-hour expiry)
- Automatic redirect for unauthorized access
- Logout functionality

### 📊 Dashboard
- **Statistics Cards** showing:
  - Total Users
  - Transactions count
  - Active Subscriptions
  - Total Revenue
- **Quick Actions** for easy navigation
- **Recent Activity** feed
- Trend indicators with percentage changes

### 👥 User Management
- **User List** with search functionality
- Filter by premium status
- User statistics (total, premium, free)
- **User Detail Page** with:
  - User information display
  - Profile editing (name, username, language, currency)
  - Premium status toggle
  - Subscription cancellation

### 💳 Payments
- **Payment Statistics**:
  - Total revenue calculation
  - Success/pending/failed counts
- **Transaction Table** with:
  - Color-coded amounts
  - Status badges
  - Formatted dates and currencies
  - Transaction descriptions

### 🧩 UI Components
- Button (primary, secondary, danger, ghost variants)
- Card (normal and elevated)
- Input fields with labels and error states
- Badges with color variants
- Stat cards with icons and trends
- Responsive tables with WHOOP styling
- Loading states and spinners

### 📱 Navigation
- Sidebar navigation (collapsible on mobile)
- Active route highlighting
- Mobile-friendly hamburger menu
- Breadcrumb navigation on detail pages

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file with your actual values:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Admin Authentication
ADMIN_DASHBOARD_PASSWORD=your-secure-password-here
ADMIN_JWT_SECRET=generate-a-random-32-char-string-here

# App Configuration
NEXT_PUBLIC_APP_NAME=Teodor Admin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

### 4. Access the Admin Panel

1. Open http://localhost:3000/login
2. Enter the password you set in `ADMIN_DASHBOARD_PASSWORD`
3. You'll be redirected to the admin dashboard

## 📝 Database Requirements

Your Supabase database should have these tables:

### users
- `id` (number)
- `telegram_id` (number)
- `username` (string, nullable)
- `first_name` (string, nullable)
- `last_name` (string, nullable)
- `language` (string, nullable)
- `default_currency` (string, nullable)
- `is_premium` (boolean, nullable)
- `created_at` (timestamp)

### transactions
- `id` (number)
- `user_id` (number)
- `amount` (number)
- `currency` (string)
- `created_at` (timestamp)

### payment_history
- `id` (string/number)
- `user_id` (number)
- `amount` (number)
- `currency` (string, nullable)
- `status` (string, nullable)
- `created_at` (timestamp)
- `description` (string, nullable)

### user_subscriptions
- `id` (number)
- `user_id` (number)
- `status` (string)
- `cancelled_at` (timestamp, nullable)

### Optional RPC Function
- `sum_paid_revenue()` - Returns total revenue sum

## 🔒 Security Notes

1. **Service Role Key**: Keep this secret and never expose it client-side
2. **Admin Password**: Use a strong, unique password
3. **JWT Secret**: Generate a cryptographically secure random string
4. **Production**: Consider adding:
   - IP whitelisting
   - Rate limiting
   - HTTPS only
   - Environment-specific configurations

## 🎯 Usage Guide

### Dashboard
- View overall statistics at a glance
- Use quick actions to navigate to common tasks
- Monitor recent activity

### Managing Users
1. Click "Users" in the sidebar
2. Use the search bar to find specific users
3. Click "View" to see user details
4. Edit user information and save changes
5. Toggle premium status as needed
6. Cancel subscriptions when required

### Viewing Payments
1. Click "Payments" in the sidebar
2. View payment statistics at the top
3. Browse recent transactions in the table
4. Status badges show payment state
5. Amounts are color-coded (green for positive, red for negative)

### Logging Out
- Click the "Logout" button in the sidebar
- You'll be redirected to the login page

## 🛠️ Customization

### Changing Colors
Edit `/src/styles/whoop-theme.css` to modify the color scheme:
```css
--whoop-green: 0 255 136;
--whoop-red: 255 59 48;
/* etc... */
```

### Adding New Pages
1. Create a new file in `/src/app/admin/[page-name]/page.tsx`
2. Add navigation item in `/src/components/admin/sidebar.tsx`
3. Follow the existing page patterns for consistency

### Modifying Components
All reusable components are in `/src/components/ui/`

## 📞 Support

For issues or questions, please check:
- The README.md file for basic setup
- The CLAUDE.md file for development guidance
- Your Supabase logs for database issues
- The browser console for client-side errors

## ✨ Features Coming Soon

Consider adding:
- Export functionality for user/payment data
- Bulk user operations
- Email notifications
- Analytics charts
- Audit logs
- Two-factor authentication