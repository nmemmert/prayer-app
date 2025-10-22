import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const nodemailer = require('nodemailer');

function generatePrayerEmailHTML(message: string, subject: string) {
  // Parse the message to extract prayer details
  const lines = message.split('\n');
  let currentPrayer = null;
  let prayers = [];
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

export async function POST(request: NextRequest) {
  try {
    const { email, subject, message } = await request.json();

    // Get SMTP config from Firestore
    const configDoc = await getDoc(doc(db, 'config', 'smtp'));
    if (!configDoc.exists()) {
      return NextResponse.json({ error: 'SMTP configuration not found' }, { status: 500 });
    }
    
    const smtpConfig = configDoc.data();

    // Create transporter with dynamic config
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    // Send email
    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject,
      text: message,
      html: generatePrayerEmailHTML(message, subject),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}