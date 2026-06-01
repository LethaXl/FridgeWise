import AsyncStorage from "@react-native-async-storage/async-storage";

/** Must match `shopping-list.tsx` so background tasks read the same data. */
export const SHOPPING_LIST_STORAGE_KEY = "fridgewise_shopping_list_v1";

export type StoredGroceryItem = {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  status?: "list" | "bought" | "fridge";
  priority?: "high" | "medium" | "low";
  completed?: boolean;
  addedDate?: string;
  notes?: string;
};

/** Items still to buy (on the Groceries screen, not fridge/purchased). */
export async function loadPendingGroceryListItems(): Promise<StoredGroceryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredGroceryItem[] = JSON.parse(raw);
    return parsed.filter((it) => {
      const status = it.status ?? "list";
      const completed = it.completed ?? status !== "list";
      return status === "list" && !completed;
    });
  } catch (e) {
    console.warn("groceryListStorage: failed to load list", e);
    return [];
  }
}

export async function loadFullShoppingListRaw(): Promise<StoredGroceryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(SHOPPING_LIST_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredGroceryItem[];
  } catch {
    return [];
  }
}

export async function saveShoppingListRaw(items: StoredGroceryItem[]): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_LIST_STORAGE_KEY, JSON.stringify(items));
}

export function parseStoredGroceryList(raw: string | null): StoredGroceryItem[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredGroceryItem[];
  } catch {
    return [];
  }
}

export function newGroceryItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `grocery-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
