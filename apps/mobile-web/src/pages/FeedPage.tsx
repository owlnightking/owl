import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast, NavBar } from "@arco-design/mobile-react";
import { IconNotice, IconHeart } from "@arco-design/mobile-react/esm/icon";
import { get, post } from "../api/client";

interface FeedItem {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  receiverName: string;
  badgeName: string | null;
  badgeIcon: string | null;
  message: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export function FeedPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await get<{ items: FeedItem[] }>("/recognition/feed", { pageSize: "50" });
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
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                likeCount: item.likedByMe ? item.likeCount - 1 : item.likeCount + 1,
                likedByMe: !item.likedByMe,
              }
            : item
        )
      );
    } catch {
      Toast.info("操作失败");
    }
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="认可动态" />
      <div className="px-4 pt-4 pb-20">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="mb-3 rounded-xl bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                {item.badgeIcon ? (
                  <img src={item.badgeIcon} className="h-16 w-16 flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center">
                    <IconNotice className="text-2xl text-blue-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
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
                  onClick={() => handleLike(item.id)}
                >
                  <IconHeart /> {item.likeCount}
                </button>
                <span className="ml-auto text-xs text-gray-400">{item.createdAt?.slice(0, 10)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-sm text-gray-400">暂无认可</div>
        )}
      </div>
      <button
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg active:bg-blue-600"
        onClick={() => navigate("/create")}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
