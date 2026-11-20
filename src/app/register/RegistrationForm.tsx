"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Tally?: {
      loadEmbeds: () => void;
    };
  }
}

interface RegistrationFormProps {
  formID: string;
}

export default function RegistrationForm({ formID }: RegistrationFormProps) {
  useEffect(() => {
    if (window.Tally) {
      window.Tally.loadEmbeds();
    }
  });

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col bg-white">
      <Script
        src="https://tally.so/widgets/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (window.Tally) {
            window.Tally.loadEmbeds();
          }
        }}
      />
      <iframe
        data-tally-src={`https://tally.so/r/${formID}`}
        title="Prisma Event Registration Form"
        width="100%"
        className="flex-1 w-full min-h-[calc(100vh-4rem)] border-0"
      />
    </div>
  );
}
