"use server"

import { createClient } from '@/utils/supabase/server'
import { Provider } from '@supabase/auth-js'
import { redirect } from 'next/navigation';

const signInWith = (provider: Provider) => async () => {

  const supabase = await createClient();
  
  const auth_callback_url = `${process.env.SITE_URL}/auth/callback`;

 const {data, error} = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: auth_callback_url },
  })

  console.log(data)
  if (error){
    console.log(error);
  }
  
  redirect(data.url ?? '/error')
};

const signinWithGoogle = signInWith('google')

export { signinWithGoogle }