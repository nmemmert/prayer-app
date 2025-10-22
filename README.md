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
