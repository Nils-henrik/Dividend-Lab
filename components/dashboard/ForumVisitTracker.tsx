"use client";

import { useEffect } from "react";
import { markForumVisited } from "@/lib/onboarding/forum-visited";

export default function ForumVisitTracker() {
  useEffect(() => {
    markForumVisited();
  }, []);

  return null;
}
