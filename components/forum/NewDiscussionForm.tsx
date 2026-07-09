"use client";

import { useActionState, useState } from "react";
import { createForumThreadAction } from "@/app/forum/actions";
import { forumCategoryGroups } from "@/data/forum";
import {
  FORUM_BODY_MAX_LENGTH,
  FORUM_TITLE_MAX_LENGTH,
} from "@/lib/forum/types";

const initialState = {
  status: "idle",
  message: "",
} as const;

type Props = {
  initialCategorySlug: string;
};

export default function NewDiscussionForm({ initialCategorySlug }: Props) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);
  const [state, formAction, isPending] = useActionState(
    createForumThreadAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Kategori
        </span>
        <select
          name="categorySlug"
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#D4AF37]/70"
        >
          {forumCategoryGroups.map((group) => (
            <optgroup key={group.slug} label={group.name}>
              {group.categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Rubrik
        </span>
        <input
          name="title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={FORUM_TITLE_MAX_LENGTH}
          placeholder="Vad vill du diskutera?"
          className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/70"
        />
        <span className="mt-2 block text-xs text-gray-500">
          {title.length}/{FORUM_TITLE_MAX_LENGTH} tecken
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Diskussion
        </span>
        <textarea
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={FORUM_BODY_MAX_LENGTH}
          rows={8}
          placeholder="Dela din fråga, insikt eller portföljtänkande..."
          className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-gray-600 focus:border-[#D4AF37]/70"
        />
        <span className="mt-2 block text-xs text-gray-500">
          {body.length}/{FORUM_BODY_MAX_LENGTH} tecken
        </span>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.14)] transition hover:bg-[#F9D976] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Skapar..." : "Skapa diskussion"}
        </button>
      </div>

      {state.status === "error" && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-gray-300">
          {state.message}
        </p>
      )}
    </form>
  );
}
