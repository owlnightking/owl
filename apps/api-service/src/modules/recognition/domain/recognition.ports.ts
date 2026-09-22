export interface RecognitionItem {
  id: number;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  receiverId: number;
  receiverName?: string;
  receiverAvatar?: string;
  badgeId: number | null;
  badgeName?: string;
  badgeIcon?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  pinned: boolean;
  approverId: number | null;
  approvedAt: Date | null;
  rejectReason: string | null;
  likeCount: number;
  likedByMe?: boolean;
  createdAt: Date;
}

export interface RecognitionCreateInput {
  receiverId: number;
  badgeId?: number;
  message: string;
}

export interface RecognitionListQuery {
  status?: "pending" | "approved" | "rejected";
  receiverId?: number;
  senderId?: number;
  page: number;
  pageSize: number;
}

export interface RecognitionRepositoryPort {
  findById(id: number): Promise<RecognitionItem | null>;
  list(query: RecognitionListQuery, userId?: number): Promise<{ items: RecognitionItem[]; total: number }>;
  listFeed(page: number, pageSize: number, userId?: number): Promise<{ items: RecognitionItem[]; total: number }>;
  create(senderId: number, input: RecognitionCreateInput): Promise<RecognitionItem>;
  approve(id: number, approverId: number): Promise<void>;
  reject(id: number, approverId: number, reason?: string): Promise<void>;
  togglePin(id: number): Promise<void>;
  toggleLike(id: number, userId: number): Promise<boolean>;
  hasLiked(id: number, userId: number): Promise<boolean>;
  countPending(): Promise<number>;
  getUserCreatedAt(userId: number): Promise<Date | null>;
  getRecognitionExp(userId: number): Promise<number>;
}

export const RECOGNITION_REPOSITORY = Symbol("RECOGNITION_REPOSITORY");
export const RECOGNITION_SERVICE = Symbol("RECOGNITION_SERVICE");
