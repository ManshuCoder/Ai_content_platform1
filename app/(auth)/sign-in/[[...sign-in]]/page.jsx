"use client";

import { SignIn, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function SignedInRedirect() {
  const router = useRouter();
  useEffect(() => {
    // If user hits /sign-in while already signed in, send them to the app
    router.replace("/feed");
  }, [router]);
  return null;
}

export default function Page() {
  return (
    <>
      <SignedOut>
        <SignIn afterSignInUrl="/feed" />
      </SignedOut>
      <SignedIn>
        <SignedInRedirect />
      </SignedIn>
    </>
  );
}
