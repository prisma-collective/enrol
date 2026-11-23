"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";
import { HelpTip } from "@/components/HelpTip";

const stakeholderTypes = [
  {
    name: "Participant",
    id: "ODpx0p",
    description: "Individuals joining an event",
    detail: "For independent attendees, researchers, or contributors participating directly in a regional event.",
    image: "/card-participant.svg",
  },
  {
    name: "Communities of Place",
    id: "5BkzBo",
    description: "Bioregional hubs & locals",
    detail: "For local hubs, regional hosts, and place-based communities coordinating fieldwork on the ground.",
    image: "/card-copl.svg",
  },
  {
    name: "Communities of Practice",
    id: "n9J7rK",
    description: "Network representatives",
    detail: "For domain networks, guilds, and shared-practice collectives collaborating across regions.",
    image: "/card-copr.svg",
  },
  {
    name: "Partner",
    id: "wQB7El",
    description: "Technologies, funders & institutions",
    detail: "For funding partners, technical collaborators, and institutional supporters.",
    image: "/card-partners.svg",
  },
];

export default function EventPage() {
  const router = useRouter();

  const handleCardClick = (id: string) => {
    router.push(`/register?type=${id}`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Sticky solid-opaque page hero */}
      <section className="hero-grad-sticky px-5 sm:px-8 py-5 border-b border-[var(--color-rule)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs sm:text-sm font-medium text-[var(--color-hub-soft)] tracking-[0.2em] uppercase">
            Step 01 · Event enrolment
          </div>
          <h1 className="display text-4xl sm:text-5xl leading-none uppercase text-white mt-2">
            Select your role
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-mute)] mt-2.5 max-w-2xl leading-relaxed">
            Choose the stakeholder role that best matches how you are joining.
          </p>
        </div>
      </section>

      {/* Stakeholder Role Cards */}
      <main className="relative z-10 flex-1 px-5 sm:px-8 py-8 max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stakeholderTypes.map((type, idx) => (
            <div
              key={type.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(type.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(type.id);
                }
              }}
              className="group card flex flex-col justify-between text-left cursor-pointer hover:border-[var(--color-rule-strong)] hover:bg-[var(--color-panel-2)] transition-all"
            >
              <div>
                <div className="relative overflow-hidden rounded-t-[0.82rem] bg-[var(--color-void)] border-b border-[var(--color-rule)]">
                  <Image
                    src={type.image}
                    alt={type.name}
                    className="h-44 w-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-300"
                    width={320}
                    height={180}
                  />
                </div>
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg sm:text-xl font-medium tracking-tight text-white">
                      {type.name}
                    </h2>
                    <HelpTip
                      label={`About ${type.name}`}
                      title={type.name}
                      align={idx >= 2 ? "right" : "left"}
                    >
                      {type.detail}
                    </HelpTip>
                  </div>
                  <p className="text-sm text-[var(--color-mute)] mt-1.5 leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-2 flex items-center justify-between text-sm font-medium text-[var(--color-flow)] group-hover:text-[var(--color-flow-hover)]">
                <span>Open form</span>
                <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
