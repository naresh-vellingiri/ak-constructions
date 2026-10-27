"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  searchPlaces,
  type PlaceSuggestion,
} from "@/lib/places";

type LocationInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  invalid?: boolean;
};

/** Wait for a pause in typing before searching, so one word is one request. */
const DEBOUNCE_MS = 300;

/**
 * Free-text location field with type-ahead suggestions.
 *
 * The field is always plain text first: anything typed is accepted, suggestions
 * only save typing. Choosing one writes its full text into the field.
 *
 * Follows the ARIA combobox pattern (input + listbox, aria-activedescendant),
 * and Escape closes the list before it is allowed to close the surrounding
 * modal.
 */
export default function LocationInput({
  id,
  value,
  onChange,
  placeholder,
  invalid,
}: LocationInputProps) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [fromGoogle, setFromGoogle] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  // `query` only changes when the visitor types, not when they pick a
  // suggestion, so choosing one does not trigger another search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await searchPlaces(query, controller.signal);
        setItems(result.suggestions);
        setFromGoogle(result.fromGoogle);
        setActive(-1);
      } catch {
        // Aborted by a newer keystroke, or both sources failed: show nothing.
        if (!controller.signal.aborted) setItems([]);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const choose = (item: PlaceSuggestion) => {
    onChange(item.full);
    setQuery("");
    setItems([]);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const visible = open && items.length > 0;

    if (event.key === "ArrowDown" && visible) {
      event.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp" && visible) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Enter" && visible && active >= 0) {
      // Pick the highlighted suggestion instead of submitting the form.
      event.preventDefault();
      choose(items[active]);
    } else if (event.key === "Escape" && visible) {
      // Close just the list; the modal's own Escape handler must not also fire.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  const showList = open && items.length > 0;

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(event) => {
        // Close when focus leaves the whole widget, not when it moves to an option.
        if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={`w-full rounded-xl border bg-slate-50 px-4 py-3.5 pr-11 text-stone-900 outline-none placeholder:text-stone-400 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-200 ${
          invalid ? "border-red-400" : "border-stone-200"
        }`}
      />

      {value && (
        <button
          type="button"
          aria-label="Clear location"
          onClick={() => {
            onChange("");
            setQuery("");
            setItems([]);
          }}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none text-stone-400 hover:bg-stone-200 hover:text-stone-700"
        >
          ×
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl"
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown (not click) so the input keeps focus and the
              // list isn't closed by the blur before the choice registers.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(item);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-baseline gap-2 border-b border-stone-100 px-4 py-3 text-sm last:border-b-0 ${
                index === active ? "bg-orange-50" : ""
              }`}
            >
              <span className="font-semibold text-stone-900">{item.main}</span>
              {item.secondary && (
                <span className="truncate text-xs text-stone-500">
                  {item.secondary}
                </span>
              )}
            </li>
          ))}

          {fromGoogle && (
            // Google's terms require its attribution beside its predictions
            // when they are not shown on a Google map.
            <li
              role="presentation"
              className="px-4 py-1.5 text-right text-[11px] text-stone-400"
            >
              powered by Google
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
