"use client";

import { SignUp, SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

function SignedInRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/feed");
  }, [router]);
  return null;
}

export default function Page() {
  return (
    <>
      <SignedOut>
        <SignUp afterSignUpUrl="/feed" />
      </SignedOut>
      <SignedIn>
        <SignedInRedirect />
      </SignedIn>
    </>
  );
}
