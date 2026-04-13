export interface Item {
  id: string;
  name: string;
  deadline?: string;
  timeSpentMs: number;
  ownerUid: string;
  isDone: boolean;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default Item;
