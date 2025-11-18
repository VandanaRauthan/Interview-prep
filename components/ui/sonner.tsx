"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "#141B2D", // bluish navy
          "--normal-text": "#E6E8F5", // soft light blue text
          "--normal-border": "#1E2440", // subtle border
          "--close-button-color": "#A6B1FF", // lavender-ish accent
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
