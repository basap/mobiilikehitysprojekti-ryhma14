import { getDoc, doc, onSnapshot, runTransaction, setDoc, } from "firebase/firestore";
import { firestore } from "../../firebase/config";
import { Item } from "./TodoItem";

type StoredTodoList = {
  items?: Partial<Item>[];
  updatedAt?: string;
};

function getTodoListRef(userUid: string) {
  return doc(firestore, "users", userUid, "todos", "list");
}

function createTodoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeStoredItem(item: Partial<Item>, index: number, userUid: string): Item {
  return {
    id: item.id ?? createTodoId(),
    name: item.name ?? "Untitled task",
    deadline: item.deadline,
    timeSpentMs: item.timeSpentMs ?? 0,
    ownerUid: item.ownerUid ?? userUid,
    isDone: item.isDone ?? false,
    isArchived: item.isArchived ?? false,
    createdAt:
      item.createdAt ?? new Date(Date.now() - index * 60000).toISOString(),
    updatedAt: item.updatedAt,
  };
}

export function subscribeToTodos(userUid: string, onItems: (items: Item[]) => void) {
  return onSnapshot(
    getTodoListRef(userUid),
    (snapshot) => {
      const data = snapshot.data() as StoredTodoList | undefined;
      const rawItems = Array.isArray(data?.items) ? data.items : [];
      onItems(rawItems.map((item, index) => normalizeStoredItem(item, index, userUid)));
    },
    (error) => {
      console.log("Load todos error:", error);
    }
  );
}

export async function ensureTodoListDocument(userUid: string) {
  const listRef = getTodoListRef(userUid);
  const snapshot = await getDoc(listRef);

  if (snapshot.exists()) {
    return;
  }

  await setDoc(listRef, {
    items: [],
    updatedAt: new Date().toISOString(),
  });
}

export async function addTodo(userUid: string, name: string, deadline: Date) {
  const listRef = getTodoListRef(userUid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(listRef);
    const data = snapshot.data() as StoredTodoList | undefined;
    const currentItems = Array.isArray(data?.items) ? data.items : [];
    const now = new Date().toISOString();

    const nextItems = [
      ...currentItems,
      {
        id: createTodoId(),
        name,
        deadline: deadline.toISOString(),
        timeSpentMs: 0,
        ownerUid: userUid,
        isDone: false,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    transaction.set(
      listRef,
      {
        items: nextItems,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}

export async function archiveTodos(userUid: string, taskIds: string[]) {
  const listRef = getTodoListRef(userUid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(listRef);
    const data = snapshot.data() as StoredTodoList | undefined;
    const currentItems = Array.isArray(data?.items) ? data.items : [];
    const now = new Date().toISOString();

    const nextItems = currentItems.map((item) =>
      taskIds.includes(item.id ?? "")
        ? { ...item, isArchived: true, updatedAt: now }
        : item
    );

    transaction.set(
      listRef,
      {
        items: nextItems,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}

export async function restoreTodo(userUid: string, taskId: string) {
  const listRef = getTodoListRef(userUid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(listRef);
    const data = snapshot.data() as StoredTodoList | undefined;
    const currentItems = Array.isArray(data?.items) ? data.items : [];
    const now = new Date().toISOString();

    const nextItems = currentItems.map((item) =>
      item.id === taskId
        ? { ...item, isArchived: false, updatedAt: now }
        : item
    );

    transaction.set(
      listRef,
      {
        items: nextItems,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}

export async function updateTodo(
  userUid: string,
  taskId: string,
  updates: { name: string; deadline: Date }
) {
  const listRef = getTodoListRef(userUid);

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(listRef);
    const data = snapshot.data() as StoredTodoList | undefined;
    const currentItems = Array.isArray(data?.items) ? data.items : [];
    const now = new Date().toISOString();

    const nextItems = currentItems.map((item) =>
      item.id === taskId
        ? {
            ...item,
            name: updates.name,
            deadline: updates.deadline.toISOString(),
            updatedAt: now,
          }
        : item
    );

    transaction.set(
      listRef,
      {
        items: nextItems,
        updatedAt: now,
      },
      { merge: true }
    );
  });
}
