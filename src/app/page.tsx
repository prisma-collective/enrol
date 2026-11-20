"use client";

import Link from "next/link";
import { FiArrowRight, FiShield, FiUserPlus } from "react-icons/fi";
import { HelpTip } from "@/components/HelpTip";

const PATHS = [
  {
    id: "first-arrivals",
    step: "01",
    eyebrow: "Registration",
    title: "First arrivals",
    summary: "New to Prisma Events? Pick your stakeholder role and complete the short enrolment form.",
    helpTitle: "Who should choose First arrivals?",
    helpText: "Select this if you are registering as an individual participant, bioregional hub, network representative, or partner for the first time.",
    cta: "Select your role",
    href: "/event",
    accent: "text-[var(--color-flow)]",
    icon: <FiUserPlus className="text-lg" />,
  },
  {
    id: "returning",
    step: "02",
    eyebrow: "Identity & DID",
    title: "Returning participant",
    summary: "Connect your Cardano wallet to register or verify your Decentralised ID (DID) for signing claims.",
    helpTitle: "What is a Cardano DID?",
    helpText: "A Decentralised ID links your Cardano wallet to verifiable claims and lets hubs recognize you cleanly across Prisma apps.",
    cta: "Verify or create DID",
    href: "/identity/guide",
    accent: "text-[var(--color-hub-soft)]",
    icon: <FiShield className="text-lg" />,
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Sticky solid-opaque page hero */}
      <section className="hero-grad-sticky px-5 sm:px-8 py-5 border-b border-[var(--color-rule)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-xs sm:text-sm font-medium text-[var(--color-hub-soft)] tracking-[0.2em] uppercase">
            Prisma Enrol
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
            Choose your path
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-mute)] mt-2.5 max-w-2xl leading-relaxed">
            Register for a Prisma event cohort or verify your returning participant identity.
          </p>
        </div>
      </section>

      {/* Main side-by-side entry cards */}
      <main className="relative z-10 flex-1 px-5 sm:px-8 py-8 sm:py-10 max-w-5xl w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
          {PATHS.map((path, idx) => (
            <div
              key={path.id}
              className="card p-6 sm:p-7 flex flex-col justify-between gap-6 hover:border-[var(--color-rule-strong)] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 text-sm font-medium ${path.accent}`}>
                    {path.icon}
                    <span className="uppercase tracking-[0.16em] text-xs">{path.step} · {path.eyebrow}</span>
                  </span>
                  <HelpTip
                    label={`About ${path.title}`}
                    title={path.helpTitle}
                    align={idx === 1 ? "right" : "left"}
                  >
                    {path.helpText}
                  </HelpTip>
                </div>

                <h2 className="display text-3xl sm:text-4xl leading-none uppercase text-white mt-5">
                  {path.title}
                </h2>
                <p className="text-base text-[var(--color-mute)] mt-3 leading-relaxed">
                  {path.summary}
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href={path.href}
                  className={idx === 0 ? "btn btn-primary w-full sm:w-auto" : "btn w-full sm:w-auto"}
                >
                  <span>{path.cta}</span>
                  <FiArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
