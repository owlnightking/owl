export interface RecognitionItem {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  badgeId: string | null;
  badgeName?: string;
  badgeIcon?: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  pinned: boolean;
  approverId: string | null;
  approvedAt: Date | null;
  rejectReason: string | null;
  likeCount: number;
  likedByMe?: boolean;
  createdAt: Date;
}

export interface RecognitionCreateInput {
  receiverId: string;
  badgeId?: string;
  message: string;
}

export interface RecognitionListQuery {
  status?: "pending" | "approved" | "rejected";
  receiverId?: string;
  senderId?: string;
  page: number;
  pageSize: number;
}

export interface RecognitionRepositoryPort {
  findById(id: string): Promise<RecognitionItem | null>;
  list(query: RecognitionListQuery, userId?: string): Promise<{ items: RecognitionItem[]; total: number }>;
  listFeed(page: number, pageSize: number, userId?: string): Promise<{ items: RecognitionItem[]; total: number }>;
  create(senderId: string, input: RecognitionCreateInput): Promise<RecognitionItem>;
  approve(id: string, approverId: string): Promise<void>;
  reject(id: string, approverId: string, reason?: string): Promise<void>;
  togglePin(id: string): Promise<void>;
  toggleLike(id: string, userId: string): Promise<boolean>;
  hasLiked(id: string, userId: string): Promise<boolean>;
  countPending(): Promise<number>;
}

export const RECOGNITION_REPOSITORY = Symbol("RECOGNITION_REPOSITORY");
export const RECOGNITION_SERVICE = Symbol("RECOGNITION_SERVICE");
