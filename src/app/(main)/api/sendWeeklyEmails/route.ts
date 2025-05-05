import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { Resend } from 'resend';

// --- Types ---
type UserStock = {
  company_name: string;
  sector: string;
  latest_price: number | null;
  previous_price: number | null;
};

type UserRecord = {
  email: string;
  stocks: UserStock[];
};

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY!;
const resend = new Resend(resendApiKey);

// Build Email HTML Content
function createEmailContent(stocks: UserStock[]): string {
  if (!stocks || stocks.length === 0) {
    return `<p>You are not following any stocks at the moment.</p>`;
  }

  const tableHeader = `
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Company Name</th>
          <th>Sector</th>
          <th>Latest Price</th>
          <th>Previous Price</th>
        </tr>
      </thead>
      <tbody>
  `;

  const tableRows = stocks
    .map((stock: UserStock) => {
      const latestPrice = stock.latest_price !== null ? `﷼${stock.latest_price}` : 'N/A';
      const previousPrice = stock.previous_price !== null ? `﷼${stock.previous_price}` : 'N/A';

      return `
        <tr>
          <td>${stock.company_name}</td>
          <td>${stock.sector}</td>
          <td>${latestPrice}</td>
          <td>${previousPrice}</td>
        </tr>
      `;
    })
    .join('');

  const tableFooter = `
      </tbody>
    </table>
  `;

  return `<p>Here is your weekly stock update:</p>${tableHeader}${tableRows}${tableFooter}`;
}

// POST Handler
export async function POST() {
  try {
    const { data, error } = await supabase.rpc('get_user_stock_data');

    if (error) {
      console.error('Error fetching user stock data:', error);
      return NextResponse.json(
        { error: 'Error fetching data from Supabase' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.log('No user data available to process.');
      return NextResponse.json({ message: 'No user data to process' });
    }

    for (const record of data as UserRecord[]) {
      const { email, stocks } = record;
      const emailHtml = createEmailContent(stocks);

      try {
        await resend.emails.send({
          from: 'Weekly-Update@bahamdan.info',
          to: email,
          subject: 'Your Weekly Stock Update',
          html: emailHtml,
        });
        console.log(`Email successfully sent to ${email}`);
      } catch (sendErr) {
        console.error(`Error sending email to ${email}:`, sendErr);
      }
    }

    return NextResponse.json({ message: 'Emails sent successfully' });
  } catch (err) {
    console.error('General error in processing weekly emails:', err);
    return NextResponse.json(
      { error: 'An error occurred while sending weekly emails' },
      { status: 500 }
    );
  }
}
