import { Link } from "react-router-dom";
import { ArrowUpRight, Camera, Compass, ShoppingBag, Sun } from "@phosphor-icons/react";

import { AppScreen } from "@/app-native/components/AppScreen";
import { articles } from "@/data/articles";
import { videos } from "@/data/videos";

export default function NativeHealth() {
  return (
    <AppScreen title="Health" tabBar className="mx-auto w-full max-w-xl px-4 pb-6 pt-4">
      {/* Large, camera-first feature card */}
      <Link
        to="/food-scanner"
        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-navy to-primary p-5 text-white shadow-[0_20px_44px_-20px_rgba(23,35,59,0.5)]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-turquoise">
          <Camera className="h-5 w-5" />
        </span>
        <p className="mt-4 font-display text-xl font-bold">Food Scanner</p>
        <p className="mt-1 text-sm text-white/80">
          Photograph a meal for an estimated nutrition breakdown.
        </p>
        <span className="mt-4 inline-flex w-fit items-center gap-1 text-sm font-semibold text-turquoise">
          Scan a meal
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>

      {/* Prayer + Qibla, compact side-by-side */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/prayer-times"
          className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Sun className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-bold text-navy">Prayer Times</span>
        </Link>
        <Link
          to="/qibla"
          className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Compass className="h-4.5 w-4.5" />
          </span>
          <span className="text-sm font-bold text-navy">Qibla</span>
        </Link>
      </div>

      {/* Nutrition content — horizontal scroll, not a full catalog */}
      <div className="mt-5 flex items-center justify-between px-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Nutrition Content
        </p>
        <Link to="/blog" className="text-xs font-semibold text-primary">
          See All
        </Link>
      </div>
      <div className="-mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {articles.slice(0, 6).map((article) => (
          <Link
            key={article.slug}
            to={`/blog/${article.slug}`}
            className="flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
          >
            <span className="flex h-20 items-center justify-center bg-gradient-to-br from-navy to-primary text-turquoise">
              <article.icon className="h-6 w-6" />
            </span>
            <span className="p-2.5">
              <span className="line-clamp-2 text-xs font-semibold text-navy">{article.title}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between px-0.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Watch &amp; Learn
        </p>
        <Link to="/videos" className="text-xs font-semibold text-primary">
          See All
        </Link>
      </div>
      <div className="-mx-4 mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
        {videos.slice(0, 6).map((video) => (
          <Link
            key={video.id}
            to="/videos"
            className="flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm"
          >
            <span className="flex h-20 items-center justify-center bg-secondary text-primary">
              <ArrowUpRight className="h-6 w-6" />
            </span>
            <span className="p-2.5">
              <span className="line-clamp-2 text-xs font-semibold text-navy">{video.title}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Products shortcut */}
      <Link
        to="/products"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-colors hover:bg-secondary"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
          <ShoppingBag className="h-4.5 w-4.5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-navy">Products</span>
          <span className="block text-xs text-muted-foreground">
            Doctor-selected nutrition products
          </span>
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </AppScreen>
  );
}
