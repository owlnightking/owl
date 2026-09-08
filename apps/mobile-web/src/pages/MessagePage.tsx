import { useEffect, useState } from "react";
import { Toast, Textarea } from "@arco-design/mobile-react";
import { IconSuccessCircle, IconNotice } from "@arco-design/mobile-react/esm/icon";
import { get, put } from "../api/client";

interface PendingItem {
  id: string;
  senderName: string;
  senderAvatar: string | null;
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

function ApprovalCard({
  item,
  onApprove,
  onReject,
}: {
  item: PendingItem;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = () => {
    onReject(item.id, reason);
    setShowReason(false);
    setReason("");
  };

  return (
    <div className="mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
          <IconNotice />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-800">
            <span className="font-medium">{item.senderName}</span> 认可了{" "}
            <span className="font-medium">{item.receiverName}</span>
          </p>
          {item.badgeName && <p className="mt-1 text-xs text-blue-500">徽章：{item.badgeName}</p>}
          <p className="mt-1 text-sm text-gray-600">{item.message}</p>
          <p className="mt-2 text-xs text-gray-400">{item.createdAt?.slice(0, 10)}</p>
        </div>
      </div>

      {showReason && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <Textarea placeholder="填写驳回原因（可选）" value={reason} onChange={(_e, val) => setReason(val)} rows={2} />
          <div className="mt-2 flex gap-2">
            <button
              className="flex-1 rounded-lg bg-gray-200 py-1.5 text-xs font-medium text-gray-600"
              onClick={() => setShowReason(false)}
            >
              取消
            </button>
            <button
              className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white"
              onClick={handleReject}
            >
              确认驳回
            </button>
          </div>
        </div>
      )}

      {!showReason && (
        <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
          <button
            className="flex-1 rounded-lg bg-green-500 py-1.5 text-xs font-medium text-white active:bg-green-600"
            onClick={() => onApprove(item.id)}
          >
            通过
          </button>
          <button
            className="flex-1 rounded-lg bg-gray-200 py-1.5 text-xs font-medium text-gray-600 active:bg-gray-300"
            onClick={() => setShowReason(true)}
          >
            驳回
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <div className={`mb-3 rounded-xl p-4 shadow-sm ${item.read ? "bg-white" : "bg-blue-50"}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <IconSuccessCircle />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">{item.title}</h3>
            {!item.read && <span className="h-2 w-2 rounded-full bg-red-500" />}
          </div>
          <p className="mt-1 text-sm text-gray-600">{item.content}</p>
          <p className="mt-2 text-xs text-gray-400">{item.createdAt?.slice(0, 10)}</p>
        </div>
      </div>
    </div>
  );
}

export function MessagePage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tab, setTab] = useState<"approval" | "notification">("approval");

  const fetchData = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        get<{ items: PendingItem[] }>("/recognition", { status: "pending", pageSize: "50" }),
        get<{ items: NotificationItem[] }>("/notifications", { pageSize: "50" }),
      ]);
      setPending(pRes.items);
      setNotifications(nRes.items);
    } catch {
      Toast.info("加载失败");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await put(`/recognition/${id}/approve`);
      Toast.success("已通过");
      fetchData();
    } catch {
      Toast.info("操作失败");
    }
  };
  const handleReject = async (id: string, reason: string) => {
    try {
      await put(`/recognition/${id}/reject`, { reason: reason || undefined });
      Toast.success("已驳回");
      fetchData();
    } catch {
      Toast.info("操作失败");
    }
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-4 pt-4 pb-20">
        <div className="mb-4 flex gap-2">
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "approval" ? "bg-blue-500 text-white" : "bg-white text-gray-600"}`}
            onClick={() => setTab("approval")}
          >
            {"待审批 ("}
            {pending.length}
            {")"}
          </button>
          <button
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${tab === "notification" ? "bg-blue-500 text-white" : "bg-white text-gray-600"}`}
            onClick={() => setTab("notification")}
          >
            系统通知
          </button>
        </div>

        {tab === "approval" ? (
          pending.length > 0 ? (
            pending.map((item) => (
              <ApprovalCard key={item.id} item={item} onApprove={handleApprove} onReject={handleReject} />
            ))
          ) : (
            <div className="py-8 text-center text-gray-400 text-sm">暂无待审批</div>
          )
        ) : notifications.length > 0 ? (
          notifications.map((item) => <NotificationCard key={item.id} item={item} />)
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm">暂无通知</div>
        )}
      </div>
    </div>
  );
}
