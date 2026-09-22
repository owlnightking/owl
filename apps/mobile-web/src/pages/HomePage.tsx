import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Toast, NavBar, Tag } from "@arco-design/mobile-react";
import { IconNotice, IconSuccessCircle, IconHeart } from "@arco-design/mobile-react/esm/icon";
import { get, post } from "../api/client";

interface MeData {
  name: string;
  avatarUrl: string | null;
}

interface PendingItem {
  id: string;
  senderName: string;
  receiverName: string;
  badgeName: string | null;
  message: string;
  createdAt: string;
}

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  read: boolean;
}

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

export function HomePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<MeData | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const meRes = await get<MeData>("/auth/me");
        setMe(meRes);
      } catch {
        // silent
      }
      try {
        const pRes = await get<{ list: PendingItem[] }>("/recognition", { status: "pending", pageSize: "50" });
        setPending(pRes.list);
      } catch {
        // silent
      }
      try {
        const nRes = await get<{ list: NotificationItem[] }>("/notifications", { pageSize: "50" });
        setNotifications(nRes.list);
      } catch {
        // silent
      }
      try {
        const fRes = await get<{ list: FeedItem[] }>("/recognition/feed", { pageSize: "20" });
        setFeed(fRes.list);
      } catch {
        // silent
      }
    })();
  }, []);

  const allMessages = [
    ...pending.map((p) => ({
      id: p.id,
      type: "approval" as const,
      title: `${p.senderName} 认可了 ${p.receiverName}`,
      time: p.createdAt,
    })),
    ...notifications.map((n) => ({ id: n.id, type: "system" as const, title: n.title, time: n.createdAt })),
  ];

  const handleLike = async (id: string) => {
    try {
      await post(`/recognition/${id}/like`);
      setFeed((prev) =>
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
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-100">
      <NavBar title="owl" />
      <div className="flex flex-1 flex-col px-4 pt-4 min-h-0 overflow-hidden">
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl text-blue-500">{me?.name?.charAt(0) || "?"}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate">{me?.name || "加载中"}</h2>
              <p className="text-xs text-gray-400">欢迎使用 OWL</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 min-h-0 overflow-hidden">
          <div className="flex flex-col rounded-xl bg-white p-4 shadow-sm h-[200px] min-h-0 shrink-0">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700">消息通知</h3>
              <button className="flex items-center gap-0.5 text-xs text-blue-500" onClick={() => navigate("/message")}>
                更多 &gt;
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {allMessages.length > 0 ? (
                allMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 mb-2 last:mb-0"
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${msg.type === "approval" ? "bg-orange-100" : "bg-blue-100"}`}
                    >
                      {msg.type === "approval" ? (
                        <IconNotice className="text-orange-500" />
                      ) : (
                        <IconSuccessCircle className="text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gray-700">{msg.title}</p>
                      <p className="text-xs text-gray-400">{msg.time?.slice(0, 10)}</p>
                    </div>
                    <Tag color={msg.type === "approval" ? "orange" : "blue"} size="small">
                      {msg.type === "approval" ? "审批" : "系统"}
                    </Tag>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">暂无消息</div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-xl bg-white p-4 shadow-sm min-h-0">
            <div className="mb-3 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-700">认可动态</h3>
              <button className="flex items-center gap-0.5 text-xs text-blue-500" onClick={() => navigate("/feed")}>
                更多 &gt;
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {feed.length > 0 ? (
                feed.map((item) => (
                  <div key={item.id} className="mb-2.5 rounded-lg border border-gray-200 p-3 last:mb-0">
                    <div className="flex gap-3">
                      {item.badgeIcon ? (
                        <img src={item.badgeIcon} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-blue-100 flex items-center justify-center">
                          <IconNotice className="text-blue-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-800 truncate">{item.senderName}</span>
                          <span className="text-xs text-gray-400">认可了</span>
                          <span className="text-sm font-semibold text-gray-800 truncate">{item.receiverName}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{item.message}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 border-t border-gray-50 pt-2">
                      <button
                        className={`flex items-center gap-1 text-xs ${item.likedByMe ? "text-red-500" : "text-gray-400"}`}
                        onClick={() => handleLike(item.id)}
                      >
                        <IconHeart /> {item.likeCount}
                      </button>
                      <span className="text-xs text-gray-400">{item.createdAt?.slice(0, 10)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-gray-400">暂无认可</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
