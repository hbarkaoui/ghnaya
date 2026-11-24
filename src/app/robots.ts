// Plan 5, tâche 4 : /robots.txt, calculé au build (écart 2).
import type { MetadataRoute } from "next";
import { robotsRules } from "@/lib/system/robots";

export default function robots(): MetadataRoute.Robots {
  return robotsRules(process.env);
}
