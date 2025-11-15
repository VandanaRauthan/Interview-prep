import { interviewCovers, mappings } from "@/constants";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
  const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
  return mappings[key as keyof typeof mappings];
};

// Simplified version - no async checking
export const getTechLogos = (techArray: string[]) => {
  return techArray.map((tech) => {
    const normalized = normalizeTechName(tech);

    // If normalized exists, use it, otherwise use fallback
    const url = normalized
      ? `${techIconBaseURL}/${normalized}/${normalized}-original.svg`
      : "/tech.svg";

    return {
      tech,
      url,
    };
  });
};

export const getRandomInterviewCover = () => {
  const randomIndex = Math.floor(Math.random() * interviewCovers.length);
  return `/covers${interviewCovers[randomIndex]}`;
};
