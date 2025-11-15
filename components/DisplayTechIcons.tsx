"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getTechLogos } from "@/lib/utils";

const DisplayTechIcons = ({ techStack }: TechIconProps) => {
  const techIcons = getTechLogos(techStack);

  return (
    <div className="flex flex-row gap-2">
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group bg-dark-300 rounded-full p-2 flex flex-center",
            index !== 0 && "-ml-2"
          )}
        >
          <Image
            src={url}
            alt={tech}
            width={24}
            height={24}
            onError={(e) => {
              // Fallback to default icon if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = "/tech.svg";
            }}
          />
          <span className="tech-tooltip">{tech}</span>
        </div>
      ))}
      {techStack.length > 3 && (
        <div className="relative group bg-dark-300 rounded-full p-2 flex flex-center -ml-2">
          <span className="text-xs">+{techStack.length - 3}</span>
        </div>
      )}
    </div>
  );
};

export default DisplayTechIcons;
