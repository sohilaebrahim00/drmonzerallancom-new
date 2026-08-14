import { Seo } from "@/components/seo/Seo";
import { YouTubeSection } from "@/components/sections/YouTubeSection";
import { breadcrumbSchema } from "@/lib/schema";

export default function VideosPage() {
  const jsonLd = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Watch & Learn", path: "/videos" },
  ]);

  return (
    <div>
      <Seo
        title="Watch & Learn"
        description="Practical nutrition insights on video from Dr. Monzer Allan — real education, explained clearly."
        path="/videos"
        jsonLd={jsonLd}
      />
      <div className="pt-6">
        <YouTubeSection />
      </div>
    </div>
  );
}
