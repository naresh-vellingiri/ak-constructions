"use client";

import { useCallback, useEffect, useState } from "react";
import PortfolioAdminCard from "@/components/PortfolioAdminCard";
import { CATEGORY_SUBTITLE_MAX, CATEGORY_TITLE_MAX } from "@/config/portfolio";
import type { AdminPortfolioCategory } from "@/types/portfolio";

const field =
  "w-full rounded-xl border border-stone-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200";

export default function AdminPortfolioPage() {
  const [categories, setCategories] = useState<AdminPortfolioCategory[] | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/portfolio");
      if (!response.ok) throw new Error("load failed");
      const data = (await response.json()) as { categories: AdminPortfolioCategory[] };
      setCategories(data.categories);
      setError("");
    } catch {
      setError(
        "Could not load the portfolio. If this is new, run docs/sql/portfolio.sql in Supabase first."
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!title.trim()) {
      setFormError("Give the category a name, e.g. Modular Kitchen.");
      return;
    }
    setFormError("");
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "create failed");
      }
      setTitle("");
      setSubtitle("");
      await load();
    } catch (err) {
      setFormError(err instanceof Error && err.message !== "create failed" ? err.message : "Could not add the category.");
    } finally {
      setIsCreating(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!categories) return;
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;

    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    setCategories(next); // show it at once; the server confirms below

    const response = await fetch("/api/admin/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((category) => category.id) }),
    });
    if (!response.ok) {
      setError("Could not save the new order.");
      await load();
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900">Portfolio</h1>
      <p className="mt-1 text-sm text-stone-500">
        The picture tiles in &ldquo;Our Completed Projects&rdquo; on your homepage. A
        visitor taps a tile to see every photo in it. The first category is
        shown large. Changes appear on the website straight away.
      </p>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
        <p className="text-sm font-semibold text-stone-800">Add a category</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={title}
            maxLength={CATEGORY_TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Name, e.g. Modular Kitchen"
            className={field}
          />
          <input
            value={subtitle}
            maxLength={CATEGORY_SUBTITLE_MAX}
            onChange={(event) => setSubtitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                create();
              }
            }}
            placeholder="Short description (optional)"
            className={field}
          />
        </div>
        <button
          type="button"
          onClick={create}
          disabled={isCreating}
          className="mt-3 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isCreating ? "Adding..." : "+ Add category"}
        </button>
        {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
      </div>

      <div className="mt-6 space-y-4">
        {categories === null && !error && <p className="text-sm text-stone-500">Loading...</p>}
        {categories?.length === 0 && (
          <p className="text-sm text-stone-500">No categories yet. Add the first one above.</p>
        )}
        {categories?.map((category, index) => (
          <PortfolioAdminCard
            key={category.id}
            category={category}
            position={index}
            total={categories.length}
            onChanged={load}
            onMove={(direction) => move(index, direction)}
          />
        ))}
      </div>
    </div>
  );
}
