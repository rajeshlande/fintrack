"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  deleteCategoryAction,
  saveCategoryAction,
  type CategoryActionState,
} from "@/lib/finance/category-actions";
import type { CategoryManagementData } from "@/lib/finance/category-queries";
import {
  buildCategoryChildrenMap,
  type FinanceCategory,
  type TransactionTypeMaster,
} from "@/lib/finance/taxonomy-types";

const initial: CategoryActionState = { error: null };

type EditorState = {
  mode: "create" | "edit";
  typeCode: string;
  category?: FinanceCategory;
  parent?: FinanceCategory | null;
  level: 1 | 2 | 3;
};

type CategoryManagerProps = CategoryManagementData;

type LevelFilter = "all" | 1 | 2 | 3;

const levelLabels: Record<number, string> = {
  1: "Category",
  2: "Subcategory",
  3: "Item",
};

const typeMeta: Record<string, { hint: string; accent: string }> = {
  INCOME: { hint: "Money you receive", accent: "#16a34a" },
  EXPENSE: { hint: "Money you spend", accent: "#dc2626" },
  SAVING: { hint: "Money set aside", accent: "#2563eb" },
  INVESTMENT: { hint: "Money invested", accent: "#7c3aed" },
  TRANSFER: { hint: "Moves between accounts", accent: "#6b7280" },
};

function matchesSearch(category: FinanceCategory, query: string) {
  const haystack = [
    category.name,
    category.code,
    category.description ?? "",
    category.icon ?? "",
    ...(category.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function collectVisibleIds(categories: FinanceCategory[], query: string) {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const matched = new Set<string>();
  for (const category of categories) {
    if (!matchesSearch(category, query)) continue;
    matched.add(category.id);
    let parentId = category.parent_id;
    while (parentId) {
      matched.add(parentId);
      parentId = byId.get(parentId)?.parent_id ?? null;
    }
  }
  return matched;
}

export function CategoryManager({ transactionTypes, categories }: CategoryManagerProps) {
  const defaultType = transactionTypes.find((t) => t.code === "EXPENSE")?.code
    ?? transactionTypes[0]?.code
    ?? "EXPENSE";
  const [typeCode, setTypeCode] = useState(defaultType);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const typeId = transactionTypes.find((t) => t.code === typeCode)?.id;
  const typeCategories = useMemo(
    () => categories.filter((c) => c.transaction_type_id === typeId),
    [categories, typeId]
  );
  const childrenMap = useMemo(
    () => buildCategoryChildrenMap(typeCategories),
    [typeCategories]
  );

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const type of transactionTypes) {
      counts.set(type.code, categories.filter((c) => c.transaction_type_id === type.id).length);
    }
    return counts;
  }, [categories, transactionTypes]);

  const query = search.trim().toLowerCase();
  const visibleIds = useMemo(
    () => (query ? collectVisibleIds(typeCategories, query) : null),
    [query, typeCategories]
  );

  const roots = useMemo(() => {
    let list = childrenMap.get(null) ?? [];
    if (visibleIds) list = list.filter((c) => visibleIds.has(c.id));
    if (levelFilter === 1) return list;
    return list;
  }, [childrenMap, visibleIds, levelFilter]);

  const flatFiltered = useMemo(() => {
    if (levelFilter === "all" && !query) return [];
    let list = typeCategories;
    if (visibleIds) list = list.filter((c) => visibleIds.has(c.id));
    if (levelFilter !== "all") list = list.filter((c) => c.level === levelFilter);
    return list;
  }, [typeCategories, visibleIds, levelFilter, query]);

  useEffect(() => {
    if (!query) return;
    setExpandedIds(collectVisibleIds(typeCategories, query));
  }, [query, typeCategories]);

  if (transactionTypes.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p className="font-semibold">Master data not loaded</p>
        <p className="mt-1 text-amber-700">
          Run <code className="text-xs bg-white/60 px-1 py-0.5 rounded">supabase/schema.sql</code> in Supabase,
          then refresh this page.
        </p>
      </div>
    );
  }

  function openCreate(level: 1 | 2 | 3, parent?: FinanceCategory | null) {
    setEditor({ mode: "create", typeCode, parent: parent ?? null, level });
  }

  function openEdit(category: FinanceCategory) {
    const code = transactionTypes.find((t) => t.id === category.transaction_type_id)?.code ?? typeCode;
    setEditor({
      mode: "edit",
      typeCode: code,
      category,
      parent: category.parent_id
        ? categories.find((c) => c.id === category.parent_id) ?? null
        : null,
      level: category.level as 1 | 2 | 3,
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    const ids = new Set<string>();
    for (const root of childrenMap.get(null) ?? []) {
      ids.add(root.id);
      for (const child of childrenMap.get(root.id) ?? []) ids.add(child.id);
    }
    setExpandedIds(ids);
  }

  const typeLabel = transactionTypes.find((t) => t.code === typeCode)?.name ?? typeCode;
  const meta = typeMeta[typeCode] ?? { hint: "", accent: "#1a1d23" };
  const showGrouped = levelFilter === "all" || levelFilter === 1;

  return (
    <div className="space-y-5 min-w-0 overflow-x-hidden">
      {/* Step 1 — pick transaction type */}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">1. Transaction type</p>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
          {transactionTypes.map((type) => {
            const active = typeCode === type.code;
            const accent = typeMeta[type.code]?.accent ?? "#1a1d23";
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setTypeCode(type.code);
                  setExpandedIds(new Set());
                  setLevelFilter("all");
                }}
                className={`snap-start shrink-0 w-[42%] min-w-[8.5rem] sm:w-auto sm:min-w-0 text-left rounded-2xl border p-3 min-h-[var(--touch-min)] transition-all ${
                  active
                    ? "border-transparent shadow-md text-white"
                    : "border-black/[0.06] bg-white/60 hover:bg-white text-gray-700"
                }`}
                style={active ? { backgroundColor: accent } : undefined}
              >
                <p className="text-sm font-bold leading-tight">{type.name}</p>
                <p className={`text-[11px] mt-0.5 ${active ? "text-white/80" : "text-gray-400"}`}>
                  {typeCounts.get(type.code) ?? 0} categories
                </p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">{meta.hint}</p>
      </div>

      {/* Step 2 — find & filter */}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">2. Find a category</p>
        <div className="space-y-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${typeLabel.toLowerCase()}…`}
            className="input-glass w-full"
            suppressHydrationWarning
          />
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/[0.03] border border-black/[0.04]">
            {(["all", 1, 2, 3] as const).map((level) => (
              <button
                key={String(level)}
                type="button"
                onClick={() => setLevelFilter(level)}
                className={`min-h-[var(--touch-min)] rounded-lg text-xs font-semibold transition-colors ${
                  levelFilter === level
                    ? "bg-white shadow-sm text-[#1a1d23]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {level === "all" ? "All" : `L${level}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 3 — list */}
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">3. Browse & update</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {typeCategories.length} {typeLabel.toLowerCase()} categories
              {query ? ` · ${flatFiltered.length || roots.length} shown` : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {showGrouped && (
              <button
                type="button"
                onClick={expandAll}
                className="min-h-[var(--touch-min)] w-full sm:w-auto px-3 rounded-xl text-xs font-semibold text-gray-600 border border-black/10 hover:bg-black/[0.03]"
              >
                Expand all
              </button>
            )}
            <button
              type="button"
              onClick={() => openCreate(1)}
              className="btn-primary text-sm px-4 min-h-[var(--touch-min)] w-full sm:w-auto"
            >
              + New category
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 mb-3 px-0.5 sm:hidden">
          L1 Category → L2 Subcategory → L3 Item
        </p>
        <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 mb-3 px-1">
          <span className="font-semibold text-gray-500">Hierarchy:</span>
          <span className="px-2 py-0.5 rounded-full bg-black/[0.04]">Category (L1)</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-full bg-black/[0.04]">Subcategory (L2)</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded-full bg-black/[0.04]">Item (L3)</span>
        </div>

        {showGrouped ? (
          roots.length === 0 ? (
            <EmptyState query={query} typeLabel={typeLabel} />
          ) : (
            <ul className="space-y-3">
              {roots.map((root) => (
                <li key={root.id}>
                  <CategoryGroup
                    category={root}
                    childrenMap={childrenMap}
                    visibleIds={visibleIds}
                    expandedIds={expandedIds}
                    levelFilter={levelFilter}
                    onToggle={toggleExpanded}
                    onEdit={openEdit}
                    onAddChild={(parent, level) => openCreate(level, parent)}
                  />
                </li>
              ))}
            </ul>
          )
        ) : flatFiltered.length === 0 ? (
          <EmptyState query={query} typeLabel={typeLabel} />
        ) : (
          <ul className="space-y-2">
            {flatFiltered.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                parentName={
                  category.parent_id
                    ? typeCategories.find((c) => c.id === category.parent_id)?.name
                    : undefined
                }
                onEdit={() => openEdit(category)}
                onAddChild={
                  category.level < 3
                    ? () => openCreate((category.level + 1) as 2 | 3, category)
                    : undefined
                }
              />
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center pt-1">
        Tap a category to edit. &ldquo;Hide&rdquo; removes it from new transactions (not deleted from database).
      </p>

      {editor && (
        <CategoryEditorModal
          editor={editor}
          transactionTypes={transactionTypes}
          categories={typeCategories}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ query, typeLabel }: { query: string; typeLabel: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white/40 px-6 py-12 text-center">
      <p className="text-sm font-medium text-gray-600">
        {query ? `No matches for "${query}"` : `No ${typeLabel.toLowerCase()} categories yet`}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {query ? "Try a different search or clear filters." : "Add a category or re-run schema.sql seeds."}
      </p>
    </div>
  );
}

function CategoryGroup({
  category,
  childrenMap,
  visibleIds,
  expandedIds,
  levelFilter,
  nested,
  onToggle,
  onEdit,
  onAddChild,
}: {
  category: FinanceCategory;
  childrenMap: Map<string | null, FinanceCategory[]>;
  visibleIds: Set<string> | null;
  expandedIds: Set<string>;
  levelFilter: LevelFilter;
  nested?: boolean;
  onToggle: (id: string) => void;
  onEdit: (category: FinanceCategory) => void;
  onAddChild: (parent: FinanceCategory, level: 2 | 3) => void;
}) {
  const children = (childrenMap.get(category.id) ?? []).filter(
    (child) => !visibleIds || visibleIds.has(child.id)
  );
  const expanded = expandedIds.has(category.id) || Boolean(visibleIds);
  const childCount = children.length;

  const shell = nested
    ? "rounded-xl border border-black/[0.05] bg-white/50 overflow-hidden my-2"
    : "rounded-2xl border border-black/[0.06] bg-white/70 overflow-hidden shadow-sm";

  return (
    <div className={shell}>
      <CategoryRow
        category={category}
        compact
        childCount={childCount}
        expandable
        expanded={expanded}
        onToggleExpand={() => onToggle(category.id)}
        onEdit={() => onEdit(category)}
        onAddChild={category.level < 3 ? () => onAddChild(category, (category.level + 1) as 2 | 3) : undefined}
      />

      {expanded && children.length > 0 && (
        <div className="border-t border-black/[0.04] bg-black/[0.01] divide-y divide-black/[0.03]">
          {children.map((child) =>
            child.level < 3 && (childrenMap.get(child.id) ?? []).length > 0 ? (
              <div key={child.id} className="pl-3 pr-1">
                <CategoryGroup
                  category={child}
                  childrenMap={childrenMap}
                  visibleIds={visibleIds}
                  expandedIds={expandedIds}
                  levelFilter={levelFilter}
                  nested
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onAddChild={onAddChild}
                />
              </div>
            ) : (
              <CategoryRow
                key={child.id}
                category={child}
                nested
                onEdit={() => onEdit(child)}
                onAddChild={
                  child.level < 3 ? () => onAddChild(child, (child.level + 1) as 2 | 3) : undefined
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  compact,
  nested,
  childCount,
  parentName,
  expandable,
  expanded,
  onToggleExpand,
  onEdit,
  onAddChild,
}: {
  category: FinanceCategory;
  compact?: boolean;
  nested?: boolean;
  childCount?: number;
  parentName?: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onEdit: () => void;
  onAddChild?: () => void;
}) {
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCategoryAction,
    initial
  );

  useEffect(() => {
    if (deleteState?.error) window.alert(deleteState.error);
  }, [deleteState?.error]);

  const accent = category.color ?? "#94a3b8";
  const pad = nested ? "py-3 px-3" : compact ? "py-3 px-3 sm:px-4" : "p-3.5";

  return (
    <div className={`flex flex-col gap-2 w-full min-w-0 ${pad}`}>
      <div className="flex items-center gap-2 min-w-0">
        {expandable && onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg text-gray-500 hover:bg-black/[0.04]"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <span className={`text-lg leading-none transition-transform ${expanded ? "rotate-90" : ""}`}>›</span>
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left rounded-xl hover:bg-black/[0.02] py-1 -my-1 transition-colors"
        >
          <span
            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          >
            {(category.name[0] ?? "?").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm text-gray-900 break-words">{category.name}</p>
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide shrink-0">
                {levelLabels[category.level]}
              </span>
              {category.is_system && (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                  Built-in
                </span>
              )}
            </div>
            {!compact && category.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{category.description}</p>
            )}
            {parentName && (
              <p className="text-[11px] text-gray-400 mt-0.5 break-words">Under {parentName}</p>
            )}
          </div>
        </button>
        {typeof childCount === "number" && childCount > 0 && (
          <span className="text-[11px] font-semibold text-gray-400 bg-black/[0.04] px-2 py-1 rounded-full shrink-0">
            {childCount}
          </span>
        )}
      </div>

      <div
        className={`grid gap-2 w-full ${onAddChild ? "grid-cols-3" : "grid-cols-2"} ${expandable ? "pl-11" : ""}`}
      >
        {onAddChild && (
          <button
            type="button"
            onClick={onAddChild}
            className="min-h-[var(--touch-min)] rounded-xl text-xs font-semibold text-gray-600 bg-black/[0.04] hover:bg-black/[0.07]"
          >
            + Add
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="min-h-[var(--touch-min)] rounded-xl text-xs font-semibold text-[#1a1d23] bg-black/[0.04] hover:bg-black/[0.07]"
        >
          Edit
        </button>
        <form
          action={deleteAction}
          className="min-w-0"
          onSubmit={(e) => {
            if (!window.confirm(`Hide "${category.name}" from new transactions?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={category.id} />
          <button
            type="submit"
            disabled={deletePending}
            className="w-full min-h-[var(--touch-min)] rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
          >
            {deletePending ? "…" : "Hide"}
          </button>
        </form>
      </div>
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 space-y-3 min-w-0">
      <div>
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function CategoryEditorModal({
  editor,
  transactionTypes,
  categories,
  onClose,
}: {
  editor: EditorState;
  transactionTypes: TransactionTypeMaster[];
  categories: FinanceCategory[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveCategoryAction, initial);
  const [level, setLevel] = useState<1 | 2 | 3>(editor.level);
  const [previewColor, setPreviewColor] = useState(editor.category?.color ?? "#6366f1");
  const [previewName, setPreviewName] = useState(editor.category?.name ?? "");

  const typeId = transactionTypes.find((t) => t.code === editor.typeCode)?.id ?? "";

  const parentOptions = useMemo(() => {
    if (level === 1) return [];
    return categories.filter((c) => c.level === level - 1);
  }, [categories, level]);

  const defaultParentId =
    editor.category?.parent_id ?? editor.parent?.id ?? parentOptions[0]?.id ?? "";

  const keywordsValue = editor.category?.keywords?.join(", ") ?? "";
  const parentLabel = editor.parent?.name ?? parentOptions.find((p) => p.id === defaultParentId)?.name;

  const [mounted, setMounted] = useState(false);
  const [mobileSheetMaxHeight, setMobileSheetMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const syncSheetHeight = () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (!isMobile) {
        setMobileSheetMaxHeight(null);
        return;
      }
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setMobileSheetMaxHeight(Math.round(viewportHeight));
    };

    syncSheetHeight();
    window.visualViewport?.addEventListener("resize", syncSheetHeight);
    window.visualViewport?.addEventListener("scroll", syncSheetHeight);
    window.addEventListener("resize", syncSheetHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncSheetHeight);
      window.visualViewport?.removeEventListener("scroll", syncSheetHeight);
      window.removeEventListener("resize", syncSheetHeight);
    };
  }, []);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state?.success, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const typeLabel = transactionTypes.find((t) => t.code === editor.typeCode)?.name ?? editor.typeCode;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center md:items-center md:p-4 overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-editor-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="relative z-10 box-border flex w-full max-w-[100vw] md:max-w-xl min-w-0 flex-col overflow-hidden rounded-t-2xl md:rounded-3xl bg-white shadow-2xl border border-black/5 max-h-[min(100dvh,calc(100dvh-env(safe-area-inset-bottom)))] md:max-h-[min(85dvh,40rem)]"
        style={mobileSheetMaxHeight ? { maxHeight: `${mobileSheetMaxHeight}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 sm:px-5 py-4 border-b border-black/5 bg-white">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: previewColor }}
              >
                {(previewName[0] ?? "+").toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="category-editor-title" className="text-lg font-bold text-[#1a1d23] truncate">
                  {editor.mode === "create" ? "New category" : "Edit category"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {typeLabel} · {levelLabels[level]}
                  {parentLabel ? ` · under ${parentLabel}` : ""}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl text-gray-500 hover:bg-black/5 shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <form
          action={action}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
          suppressHydrationWarning
        >
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain overflow-x-hidden px-4 sm:px-5 py-4 space-y-4">
          {editor.category && <input type="hidden" name="id" value={editor.category.id} />}
          <input type="hidden" name="transaction_type_id" value={typeId} />
          <input type="hidden" name="level" value={level} />
          <input type="hidden" name="is_active" value="true" />

          <FormSection
            title="Where does it belong?"
            description="Choose the hierarchy level and parent category."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cat_level" className="block text-xs font-medium text-gray-600 mb-1">
                  Level
                </label>
                <select
                  id="cat_level"
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value, 10) as 1 | 2 | 3)}
                  disabled={editor.mode === "edit"}
                  className="input-glass disabled:opacity-60 text-sm"
                  suppressHydrationWarning
                >
                  <option value={1}>Category — top level (e.g. Food)</option>
                  <option value={2}>Subcategory — under a category (e.g. Groceries)</option>
                  <option value={3}>Item — most specific (e.g. Milk)</option>
                </select>
              </div>
              {level > 1 && (
                <div>
                  <label htmlFor="parent_id" className="block text-xs font-medium text-gray-600 mb-1">
                    Parent {levelLabels[level - 1].toLowerCase()}
                  </label>
                  <select
                    id="parent_id"
                    name="parent_id"
                    required
                    defaultValue={defaultParentId}
                    className="input-glass text-sm"
                    suppressHydrationWarning
                  >
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Name & code" description="Shown when logging transactions.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="category_name" className="block text-xs font-medium text-gray-600 mb-1">
                  Display name <span className="text-red-500">*</span>
                </label>
                <input
                  id="category_name"
                  name="name"
                  required
                  defaultValue={editor.category?.name ?? ""}
                  onChange={(e) => setPreviewName(e.target.value)}
                  placeholder="e.g. Groceries"
                  className="input-glass text-sm"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label htmlFor="category_code" className="block text-xs font-medium text-gray-600 mb-1">
                  Code <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="category_code"
                  name="code"
                  defaultValue={editor.category?.code ?? ""}
                  placeholder="Auto-generated"
                  className="input-glass uppercase text-sm"
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div>
              <label htmlFor="category_description" className="block text-xs font-medium text-gray-600 mb-1">
                Description
              </label>
              <textarea
                id="category_description"
                name="description"
                rows={2}
                defaultValue={editor.category?.description ?? ""}
                placeholder="Short note about this category"
                className="input-glass resize-none text-sm"
                suppressHydrationWarning
              />
            </div>
          </FormSection>

          <FormSection title="Appearance" description="Color and icon for quick recognition.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="category_color" className="block text-xs font-medium text-gray-600 mb-1">
                  Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    id="category_color"
                    name="color"
                    type="color"
                    defaultValue={editor.category?.color ?? "#6366f1"}
                    onChange={(e) => setPreviewColor(e.target.value)}
                    className="input-glass h-[var(--touch-min)] w-14 p-1 shrink-0"
                    suppressHydrationWarning
                  />
                  <span className="text-xs text-gray-400 font-mono">{previewColor}</span>
                </div>
              </div>
              <div>
                <label htmlFor="category_icon" className="block text-xs font-medium text-gray-600 mb-1">
                  Icon name
                </label>
                <input
                  id="category_icon"
                  name="icon"
                  defaultValue={editor.category?.icon ?? ""}
                  placeholder="e.g. utensils"
                  className="input-glass text-sm"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Search & order"
            description="Keywords help find categories later. Sort order controls list position."
          >
            <div>
              <label htmlFor="category_keywords" className="block text-xs font-medium text-gray-600 mb-1">
                Keywords <span className="text-gray-400 font-normal">(comma-separated)</span>
              </label>
              <input
                id="category_keywords"
                name="keywords"
                defaultValue={keywordsValue}
                placeholder="swiggy, zomato, food delivery"
                className="input-glass text-sm"
                suppressHydrationWarning
              />
            </div>
            <div className="w-full sm:w-32">
              <label htmlFor="sort_order" className="block text-xs font-medium text-gray-600 mb-1">
                Sort order
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                min="0"
                defaultValue={editor.category?.sort_order ?? 0}
                className="input-glass text-sm"
                suppressHydrationWarning
              />
            </div>
          </FormSection>

            {state?.error && <p className="alert-error text-sm">{state.error}</p>}
          </div>

          <div className="shrink-0 border-t border-black/[0.04] bg-white px-4 sm:px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[var(--touch-min)] rounded-xl border border-black/10 text-sm font-semibold text-gray-600 hover:bg-black/5 w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 min-h-[var(--touch-min)] btn-primary w-full sm:w-auto"
              >
                {pending ? "Saving…" : editor.mode === "create" ? "Create category" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
