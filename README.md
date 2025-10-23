# Prayer App

A Progressive Web App (PWA) for journaling prayers and praises, organized by date, with journaling functionality and email reminders.

## Features

- User authentication with Firebase (login and signup)
- Add prayers and praises with date organization
- Journal entries for each prayer
- "Pray For" field to specify a person for each prayer
- Email field auto-populated with user's email for reminders
- Archive prayers instead of deleting them
- View archived prayers with dedicated tab
- Search prayers by content, type, or journal (dedicated Search tab)
- Pagination for large numbers of entries
- Share prayers on social media, email, and text
- Prominent share buttons with visual feedback
- Admin panel for SMTP configuration and user management
- Email notifications (requires configuration)
- Reminder frequency options (daily, weekly, monthly, or never)
- Option to include active prayers summary in reminder emails
- Beautiful HTML-formatted emails with prayer cards and visual styling
- PWA for offline access and installation
- Dark mode theme
- Bottom navigation tabs for easy switching (Add Entry, Active, Archived, Search)
- Engaging loading screen with animations and inspirational content (minimum 5-second display)
- Enhanced bottom navigation with gradients, shadows, and improved touch targets

## API Endpoints

- `GET/POST /api/send-email` - Send a single email reminder
- `GET/POST /api/send-scheduled-emails` - Send scheduled email reminders to all users

## Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Email/Password provider
3. Enable Firestore Database
4. Get your Firebase config and replace the placeholder in `src/lib/firebase.ts`

Users can now register accounts directly in the app!

## Admin Setup

Admin access is restricted to specific email addresses. Admins can manage the admin email list directly in the app through the Admin panel.

**To add/remove admin emails:**
1. Log in as an existing admin
2. Click the "Admin" button
3. Scroll to "Admin Email Management" section
4. Add new admin emails or remove existing ones
5. Changes are saved automatically to Firestore

Admin users can access the admin panel by clicking the "Admin" button in the header. From there, they can configure:

- SMTP settings for email sending
- Admin email management
- Other server configurations

The admin panel saves settings to Firestore for persistent configuration.

## Firestore Security Rules

To enable SMTP configuration saving and other admin features, you need to deploy Firestore security rules:

1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize or connect to your Firebase project:
   ```bash
   firebase use --add
   ```
   Select your prayer-app project.

4. Deploy the security rules using the provided script:
   ```bash
   # On Linux/Mac
   ./deploy-firestore-rules.sh
   
   # On Windows
   deploy-firestore-rules.bat
   ```
   
   Or deploy manually:
   ```bash
   firebase deploy --only firestore:rules
   ```

The `firestore.rules` file in this repository allows authenticated users to read/write configuration data needed for the admin panel.

## SMTP Configuration

After deploying Firestore rules, you can configure SMTP settings through the admin panel:

1. Log in as an admin user
2. Click the "Admin" button
3. Fill in your SMTP provider details (Gmail, Outlook, etc.)
4. Save the configuration

**Gmail Setup:**
- Host: `smtp.gmail.com`
- Port: `587` (or `465` for SSL)
- Username: Your Gmail address
- Password: App password (not your regular password)
- From: Your Gmail address
- Use SSL/TLS: Checked for port 465, unchecked for port 587

**Note:** For Gmail, you'll need to generate an "App Password" in your Google Account settings.

## Troubleshooting

### Common Issues

1. **Firebase Configuration**: Ensure all Firebase config values are correctly set in `src/lib/firebase.ts`.

2. **SMTP Settings**: Verify SMTP credentials in the Admin panel. Use app passwords for Gmail.

3. **PWA Installation**: Clear browser cache if PWA doesn't install properly.

4. **Email Reminders**: Check Firestore security rules and ensure SMTP is configured.

### Development

- Run `npm run dev` for development server
- Run `npm run build` for production build
- Run `npm run lint` for code linting
- Run `npm test` for running tests

## User Guides

### Adding Prayers

1. Click the "Add" tab
2. Fill in the date, type (prayer/praise), text, and optional journal
3. Set reminder frequency
4. Click "Add Prayer"

### Managing Prayers

- **Active**: View current prayers
- **Archived**: View archived prayers
- **Search**: Search by content
- **Community**: View shared prayers

### Profile Customization

- Click "Profile" to update avatar, theme, and categories

### Admin Features

- Configure SMTP for emails
- Manage admin users
- View analytics

## Getting Started

## Email Configuration

### Option 1: EmailJS (Free, Recommended)

EmailJS provides free email sending without server-side SMTP configuration:

1. **Sign up at [emailjs.com](https://www.emailjs.com/)**
2. **Create an Email Service** (Gmail, Outlook, etc.)
3. **Create an Email Template** with these variables:
   ```
   Subject: New {{prayer_type}} added - {{reminder_frequency}} reminders enabled
   
   Hi {{to_name}},
   
   A new prayer has been added to your Prayer App:
   
   Date: {{prayer_date}}
   Type: {{prayer_type}}
   Text: {{prayer_text}}
   Journal: {{prayer_journal}}
   Praying for: {{praying_for}}
   
   Reminder Frequency: {{reminder_frequency}}
   
   Best regards,
   Prayer App
   ```
4. **Get your credentials**:
   - Service ID
   - Template ID  
   - Public Key

5. **Add to `.env.local`**:
   ```
   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
   ```

### Option 2: SMTP (Advanced)

For custom SMTP servers, configure settings in the admin panel after deploying Firestore rules.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuration

For email reminders, configure SMTP settings in `src/app/api/send-email/route.ts`.

## Build

```bash
npm run build
```

## Deploy

Deploy to Vercel or any platform supporting Next.js PWAs.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Docker Support

This application is fully containerized and ready for deployment.

### Building Locally

```bash
# Build the Docker image
docker build -t prayer-app .

# Run the container
docker run -p 3000:3000 prayer-app
```

### Using Docker Compose

```bash
# Start the application
docker-compose up -d

# Stop the application
docker-compose down
```

### GitHub Container Registry

The application includes GitHub Actions CI/CD that automatically builds and pushes Docker images to GitHub Container Registry on every push to the main branch.

Images are available at: `ghcr.io/[your-username]/prayer-app:latest`
