"use client";

import { deleteNetworthAction } from "@/lib/finance/actions";

export function DeleteNetworthButton({ id }: { id: string }) {
  return (
    <form action={deleteNetworthAction.bind(null, id)}>
      <button type="submit" className="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50">
        Delete
      </button>
    </form>
  );
}
