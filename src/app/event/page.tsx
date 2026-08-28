"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

const stakeholderTypes = [
  { name: "Participant", id: "3NB7ON", description: "Individuals", image: "/card-participant.svg" },
  { name: "Communities of Place", id: "5BkzBo", description: "Bioregional hubs & locals", image: "/card-copl.svg" },
  { name: "Communities of Practice", id: "n9J7rK", description: "Network representatives", image: "/card-copr.svg" },
  { name: "Partner", id: "wQB7El", description: "Technologies, funders, institutions", image: "/card-partners.svg" },
];

export default function EventPage() {
  const router = useRouter();

  const handleCardClick = (id: string) => {
    router.push(`/register?type=${id}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="min-h-screen flex flex-col items-center justify-center relative z-20 pt-28 md:pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-10 mb-40 md:mb-0">
          {stakeholderTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleCardClick(type.id)}
              className="relative border border-rule bg-black/20 overflow-hidden transition-colors duration-300 cursor-pointer flex flex-col hover:border-mute/40"
            >
              <Image
                src={type.image}
                alt={type.name}
                className="h-50 w-full object-cover mb-0"
                width={200}
                height={150}
              />
              <div className="h-0.5 bg-rule" />
              <div className="absolute inset-0 bg-gray-600/15 z-10" />
              <div className="p-6">
                <h2 className="text-2xl text-white mb-2 z-20 relative text-wrap">{type.name}</h2>
                <p className="text-gray-300 mb-4 text-wrap">{type.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
