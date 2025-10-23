import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { admin } from '@/lib/firebase-admin';
import nodemailer from 'nodemailer';

function generatePrayerEmailHTML(message: string, subject: string) {
  // Parse the message to extract prayer details
  const lines = message.split('\n');
  let currentPrayer = null;
  const prayers = [];
  let summarySection = false;

  for (const line of lines) {
    if (line.includes('New prayer added') || line.includes('New praise added')) {
      currentPrayer = { type: '', date: '', text: '', journal: '', prayFor: '' };
    } else if (line.startsWith('Date: ')) {
      if (currentPrayer) currentPrayer.date = line.replace('Date: ', '');
    } else if (line.startsWith('Praying for: ')) {
      if (currentPrayer) currentPrayer.prayFor = line.replace('Praying for: ', '');
    } else if (line.startsWith('Journal: ')) {
      if (currentPrayer) currentPrayer.journal = line.replace('Journal: ', '');
    } else if (line.includes('--- Active Prayers Summary ---')) {
      summarySection = true;
      prayers.push({ type: 'summary-header', text: 'Active Prayers Summary' });
    } else if (summarySection && line.includes(' - ')) {
      // Parse summary lines like "2025-01-15 - PRAYER: prayer text"
      const match = line.match(/(\d{4}-\d{2}-\d{2}) - (PRAYER|PRAISE): (.+)/);
      if (match) {
        prayers.push({
          type: 'summary-item',
          date: match[1],
          prayerType: match[2].toLowerCase(),
          text: match[3]
        });
      }
    } else if (currentPrayer && !currentPrayer.text && line.trim()) {
      currentPrayer.text = line;
      prayers.push(currentPrayer);
      currentPrayer = null;
    }
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header .subtitle {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 30px 20px;
        }
        .prayer-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .prayer-type {
            font-weight: 600;
            color: #667eea;
            text-transform: uppercase;
            font-size: 14px;
            letter-spacing: 0.5px;
        }
        .prayer-date {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
        }
        .prayer-text {
            font-size: 16px;
            line-height: 1.6;
            margin: 10px 0;
        }
        .prayer-journal {
            background: #fff;
            border-left: 3px solid #764ba2;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
            color: #555;
        }
        .pray-for {
            background: #e8f4fd;
            padding: 10px 15px;
            border-radius: 6px;
            margin: 10px 0;
            font-weight: 500;
            color: #2c5282;
        }
        .summary-section {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .summary-section h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        .summary-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
        }
        .summary-item .date {
            color: #ffed4e;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .summary-item .prayer-type {
            color: #ffed4e;
            font-size: 12px;
            margin-left: 10px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
        .verse {
            background: #667eea;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
        }
        .verse blockquote {
            font-style: italic;
            font-size: 16px;
            margin: 0 0 10px 0;
        }
        .verse cite {
            font-size: 14px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙏 Prayer App</h1>
            <div class="subtitle">${subject}</div>
        </div>

        <div class="content">
            ${prayers.map(prayer => {
                if (prayer.type === 'summary-header') {
                    return `
                        <div class="summary-section">
                            <h3>📚 ${prayer.text}</h3>
                            <p>Here are all your active prayers and praises:</p>
                        </div>
                    `;
                } else if (prayer.type === 'summary-item') {
                    return `
                        <div class="summary-item">
                            <div class="date">${prayer.date ? new Date(prayer.date).toLocaleDateString() : 'Unknown Date'}</div>
                            <div class="prayer-type">${prayer.prayerType}</div>
                            <div class="prayer-text">${prayer.text}</div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="prayer-card">
                            <div class="prayer-type">${prayer.type}</div>
                            <div class="prayer-date">${prayer.date ? new Date(prayer.date).toLocaleDateString() : 'Unknown Date'}</div>
                            <div class="prayer-text">${prayer.text}</div>
                            ${prayer.prayFor ? `<div class="pray-for">🙋 Praying for: ${prayer.prayFor}</div>` : ''}
                            ${prayer.journal && prayer.journal !== 'None' ? `<div class="prayer-journal">📝 Journal: ${prayer.journal}</div>` : ''}
                        </div>
                    `;
                }
            }).join('')}

            <div class="verse">
                <blockquote>"Pray without ceasing"</blockquote>
                <cite>— 1 Thessalonians 5:17</cite>
            </div>
        </div>

        <div class="footer">
            <p>Sent with ❤️ from your Prayer App</p>
            <p>This email helps you stay connected to your spiritual journey.</p>
        </div>
    </div>
</body>
</html>`;
  return html;
}

export async function GET() {
  try {
    console.log('🔄 Checking for scheduled emails...');

    // Get SMTP config
    const configDoc = await getDoc(doc(db, 'config', 'smtp'));
    if (!configDoc.exists()) {
      console.log('❌ SMTP configuration not found');
      return NextResponse.json({ message: 'SMTP configuration not found' }, { status: 500 });
    }

    const smtpConfig = configDoc.data();

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // Get all users who have reminder preferences
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let emailsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Check if user has reminder preferences
      if (!userData.reminderFrequency || userData.reminderFrequency === 'never') {
        continue;
      }

      // Check last email sent time
      const lastEmailSent = userData.lastEmailSent ? new Date(userData.lastEmailSent.toDate()) : new Date(0);
      const now = new Date();

      let shouldSendEmail = false;
      const frequency = userData.reminderFrequency;

      if (frequency === 'daily') {
        // Send if more than 24 hours have passed
        shouldSendEmail = (now.getTime() - lastEmailSent.getTime()) > (24 * 60 * 60 * 1000);
      } else if (frequency === 'weekly') {
        // Send if more than 7 days have passed
        shouldSendEmail = (now.getTime() - lastEmailSent.getTime()) > (7 * 24 * 60 * 60 * 1000);
      } else if (frequency === 'monthly') {
        // Send if more than 30 days have passed
        shouldSendEmail = (now.getTime() - lastEmailSent.getTime()) > (30 * 24 * 60 * 60 * 1000);
      }

      if (!shouldSendEmail) {
        continue;
      }

      // Get user's active prayers
      const prayersRef = collection(db, 'prayers');
      const prayersQuery = await getDocs(prayersRef);
      const userPrayers = prayersQuery.docs
        .filter(doc => doc.data().userId === userId && !doc.data().archived)
        .map(doc => doc.data());

      if (userPrayers.length === 0) {
        continue; // No active prayers to send
      }

      // Build email content
      let message = `--- Active Prayers Summary ---\n`;
      userPrayers.forEach(prayer => {
        message += `\n${prayer.date} - ${prayer.type.toUpperCase()}: ${prayer.text}`;
        if (prayer.prayFor) {
          message += ` (Praying for: ${prayer.prayFor})`;
        }
        if (prayer.journal) {
          message += `\n  Journal: ${prayer.journal}`;
        }
        message += `\n`;
      });

      const subject = `Your ${frequency} prayer reminder - ${userPrayers.length} active prayers`;

      try {
        // Send email
        await transporter.sendMail({
          from: smtpConfig.from,
          to: userData.email,
          subject,
          text: message,
          html: generatePrayerEmailHTML(message, subject),
        });

        // Send push notification if FCM token exists
        if (userData.fcmToken && admin.apps.length > 0) {
          try {
            await admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: subject,
                body: `You have ${userPrayers.length} active prayers to review.`,
              },
            });
            console.log(`✅ Sent push notification to ${userData.email}`);
          } catch (fcmError) {
            console.error(`❌ Failed to send FCM to ${userData.email}:`, fcmError);
          }
        }

        // Update last email sent time
        await updateDoc(doc(db, 'users', userId), {
          lastEmailSent: new Date(),
        });

        emailsSent++;
        console.log(`✅ Sent ${frequency} reminder email to ${userData.email}`);

      } catch (emailError) {
        console.error(`❌ Failed to send email to ${userData.email}:`, emailError);
      }
    }

    console.log(`📧 Scheduled email check complete. Sent ${emailsSent} emails.`);
    return NextResponse.json({
      message: `Scheduled email check complete. Sent ${emailsSent} emails.`,
      emailsSent
    });

  } catch (error) {
    console.error('❌ Scheduled email error:', error);
    return NextResponse.json({ error: 'Failed to process scheduled emails' }, { status: 500 });
  }
}