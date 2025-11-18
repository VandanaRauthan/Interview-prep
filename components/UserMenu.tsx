"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const UserMenu = ({
  userName,
  userImage,
}: {
  userName?: string;
  userImage?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (res.ok) {
        toast.success("Signed out successfully");
        router.push("/sign-in");
      } else {
        toast.error("Failed to sign out");
      }
    } catch (err) {
      toast.error("Error signing out");
    }
  };

  // Get first letter of name for fallback avatar
  const initials = userName?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="User menu"
        aria-expanded={open}
      >
        {userImage && !imageError ? (
          <img
            src={userImage}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-200 dark:ring-dark-200"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
            {initials}
          </div>
        )}
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {userName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            View profile
          </span>
        </div>
        <svg
          className={`hidden sm:block w-4 h-4 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-dark-300 rounded-xl shadow-2xl z-50 border border-gray-200 dark:border-dark-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Info Section */}
            <div className="p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 border-b border-gray-200 dark:border-dark-200">
              <div className="flex items-center gap-3">
                {userImage && !imageError ? (
                  <img
                    src={userImage}
                    alt="profile"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-dark-300"
                    onError={() => setImageError(true)}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Manage your account
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors duration-150 group"
                onClick={() => {
                  setOpen(false);
                  router.push("/");
                }}
              >
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Dashboard
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    View your interviews
                  </p>
                </div>
              </button>

              <button
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors duration-150 group"
                onClick={() => {
                  setOpen(false);
                  router.push("/interview");
                }}
              >
                <svg
                  className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    New Interview
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Create a practice session
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-gray-200 dark:border-dark-200" />

              <button
                className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 group"
                onClick={handleSignOut}
              >
                <svg
                  className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    Sign out
                  </p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserMenu;
