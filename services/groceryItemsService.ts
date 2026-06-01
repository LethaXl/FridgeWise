import { supabase } from "@/lib/supabase";
import type { StoredGroceryItem } from "@/services/groceryListStorage";

export interface GroceryItemRow {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  status: "list" | "bought" | "fridge";
  priority: "high" | "medium" | "low" | null;
  completed: boolean;
  notes: string | null;
  added_date: string | null;
  created_at: string;
  updated_at: string;
}

function isMissingTableOrRelationError(error: {
  message?: string;
  code?: string;
}): boolean {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache") ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

function rowToStored(row: GroceryItemRow): StoredGroceryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? undefined,
    quantity: row.quantity,
    unit: row.unit ?? undefined,
    status: row.status,
    priority: row.priority ?? undefined,
    completed: row.completed,
    addedDate: row.added_date ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function storedToRow(item: StoredGroceryItem, userId: string): GroceryItemRow {
  const status = item.status ?? "list";
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    category: item.category ?? null,
    quantity: item.quantity,
    unit: item.unit ?? null,
    status,
    priority: item.priority ?? "medium",
    completed: item.completed ?? status !== "list",
    notes: item.notes ?? null,
    added_date: item.addedDate ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export const groceryItemsService = {
  async isAvailable(): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("grocery_items")
      .select("id")
      .limit(1);
    if (!error) return true;
    return !isMissingTableOrRelationError(error);
  },

  async getItems(): Promise<StoredGroceryItem[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id)
      .order("added_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableOrRelationError(error)) return [];
      throw error;
    }

    return (data as GroceryItemRow[]).map(rowToStored);
  },

  /** Replace the user's cloud list with the given items (full sync). */
  async replaceAll(items: StoredGroceryItem[]): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error: deleteError } = await supabase
      .from("grocery_items")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      if (isMissingTableOrRelationError(deleteError)) return;
      throw deleteError;
    }

    if (items.length === 0) return;

    const rows = items.map((it) => storedToRow(it, user.id));
    const { error: insertError } = await supabase
      .from("grocery_items")
      .insert(rows);

    if (insertError) {
      if (isMissingTableOrRelationError(insertError)) return;
      throw insertError;
    }
  },
};
