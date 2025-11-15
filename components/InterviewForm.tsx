"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const InterviewForm = ({ userId }: { userId: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "",
    level: "Mid",
    techstack: "",
    type: "Mixed",
    amount: 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate number of questions (minimum 1)
    if (formData.amount < 1) {
      toast.error("At least 1 question is required");
      setFormData({ ...formData, amount: 1 });
      return;
    }

    setLoading(true);

    try {
      console.log("Submitting form data:", formData);

      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          userid: userId,
        }),
      });

      const data = await response.json();

      console.log("API Response:", data);

      if (data.success && data.interviewId) {
        console.log("Interview created successfully:", data.interviewId);

        // Show success toast
        toast.success("Interview generated successfully!", {
          description: "Redirecting to homepage...",
          duration: 2000,
        });

        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        console.error("Generation failed:", data);
        toast.error("Failed to generate interview", {
          description: data.error || "Please try again",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred", {
        description: "Please check your connection and try again",
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Create Your Interview</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Role */}
        <div>
          <label className="block text-sm font-medium mb-2">Job Role *</label>
          <input
            type="text"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g., Frontend Developer"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Experience Level *
          </label>
          <select
            required
            value={formData.level}
            onChange={(e) =>
              setFormData({ ...formData, level: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
          >
            <option value="Junior" className="bg-black text-white">
              Junior
            </option>
            <option value="Mid" className="bg-black text-white">
              Mid
            </option>
            <option value="Senior" className="bg-black text-white">
              Senior
            </option>
          </select>
        </div>

        {/* Tech Stack */}
        <div>
          <label className="block text-sm font-medium mb-2">Tech Stack *</label>
          <input
            type="text"
            required
            value={formData.techstack}
            onChange={(e) =>
              setFormData({ ...formData, techstack: e.target.value })
            }
            placeholder="e.g., React, Node.js, MongoDB"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter comma-separated technologies
          </p>
        </div>

        {/* Question Type */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Question Type *
          </label>
          <select
            required
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-black text-white"
          >
            <option value="Behavioral" className="bg-black text-white">
              Behavioral
            </option>
            <option value="Technical" className="bg-black text-white">
              Technical
            </option>
            <option value="Mixed" className="bg-black text-white">
              Mixed
            </option>
          </select>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Questions *
          </label>
          <input
            type="number"
            required
            min={1}
            value={formData.amount}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              if (value >= 1) {
                setFormData({ ...formData, amount: value });
              }
            }}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter any number of questions (minimum 1)
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Generating Interview..." : "Generate Interview"}
        </Button>
      </form>
    </div>
  );
};

export default InterviewForm;
