export interface TimeSpentEntry {
  date: string;
  durationMs: number;
  savedAt: string;
}

export interface Item {
  id: string;
  name: string;
  deadline?: string;
  timeSpentMs: number;
  timeSpentEntries: TimeSpentEntry[];
  ownerUid: string;
  isDone: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default Item;
