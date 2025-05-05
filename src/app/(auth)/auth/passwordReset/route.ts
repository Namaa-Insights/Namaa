// app/api/reset-password/route.ts
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { email } = await request.json();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SITE_URL}/passwordUpdate`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
