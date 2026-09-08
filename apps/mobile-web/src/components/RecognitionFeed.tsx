import { useEffect, useState } from "react";
import { Toast } from "@arco-design/mobile-react";
import { IconHeart, IconNotice } from "@arco-design/mobile-react/esm/icon";
import { get, post } from "../api/client";

interface FeedItem {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  receiverName: string;
  badgeName: string | null;
  badgeIcon: string | null;
  message: string;
  pinned: boolean;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

function RecognitionCard({ item, onLike }: { item: FeedItem; onLike: (id: string) => void }) {
  return (
    <div className="mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {item.badgeIcon ? (
          <img src={item.badgeIcon} alt="徽章" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-2xl text-blue-500">
              <IconNotice />
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{item.senderName}</span>
            <span className="text-xs text-gray-400">认可了</span>
            <span className="text-sm font-semibold text-gray-800">{item.receiverName}</span>
          </div>
          {item.badgeName && <p className="mt-1 text-xs text-blue-500">徽章：{item.badgeName}</p>}
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.message}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3">
        <button
          className={`flex items-center gap-1 text-sm ${item.likedByMe ? "text-red-500" : "text-gray-500"}`}
          onClick={() => onLike(item.id)}
        >
          <IconHeart />
          <span>{item.likeCount}</span>
        </button>
        <span className="ml-auto text-xs text-gray-400">{item.createdAt?.slice(0, 10)}</span>
      </div>
    </div>
  );
}

export function RecognitionFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await get<{ items: FeedItem[]; total: number }>("/recognition/feed", { pageSize: "50" });
      setItems(res.items);
    } catch {
      Toast.info("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLike = async (id: string) => {
    try {
      await post(`/recognition/${id}/like`);
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              likeCount: item.likedByMe ? item.likeCount - 1 : item.likeCount + 1,
              likedByMe: !item.likedByMe,
            };
          }
          return item;
        })
      );
    } catch {
      Toast.info("操作失败");
    }
  };

  if (loading) {
    return <div className="py-8 text-center text-gray-400 text-sm">加载中...</div>;
  }

  return (
    <div>
      {items.map((item) => (
        <RecognitionCard key={item.id} item={item} onLike={handleLike} />
      ))}
      {items.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">暂无认可</div>}
    </div>
  );
}
