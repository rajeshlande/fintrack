"use client";

import { deleteCardAction } from "@/lib/finance/actions";

export function DeleteCardButton({ id }: { id: string }) {
  return (
    <form action={deleteCardAction.bind(null, id)}>
      <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
        Delete
      </button>
    </form>
  );
}
