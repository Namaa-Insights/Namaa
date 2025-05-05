"use server"

import { cn } from "@/lib/utils"
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { login } from '@/utils/actions/login'
import { signinWithGoogle } from "@/utils/actions/signinWithOAuth";
import Link from "next/link";

export async function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="flex justify-end">
            <Button className="">
              <Link href="/">
                Back
              </Link>
            </Button>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@domain.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" name="password" type="password" placeholder="******" required />
              </div>
              <div>
              <a href="passwordReset" className="underline underline-offset-4">
                Forgot Password?
              </a>
              </div>
              <Button type="submit" className="w-full" formAction={login}>
                Login
              </Button>
              <Button variant="outline" className="w-full" formAction={signinWithGoogle} formNoValidate>
                <FaGoogle />
                Login with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="register" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
