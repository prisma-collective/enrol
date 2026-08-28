"use client";

import { Suspense } from "react";
import RegistrationForm from "./RegistrationForm";
import { useSearchParams } from "next/navigation";

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const formID = searchParams.get("type") || "default";

  return (
    <div className="min-h-screen w-full">
      <RegistrationForm formID={formID} />
    </div>
  );
}
