import { useEffect, useState } from "react";
import { Toast, Textarea } from "@arco-design/mobile-react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../api/client";

interface Badge {
  id: string;
  name: string;
  icon: string | null;
}
interface User {
  id: string;
  name: string;
}

export function CreateRecognitionPage() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [bRes, uRes] = await Promise.all([
          get<Badge[]>("/recognition/badges"),
          get<{ items: User[] }>("/users", { pageSize: "100" }),
        ]);
        setBadges(bRes);
        setUsers(uRes.items);
      } catch {
        Toast.info("加载失败");
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!receiverId) {
      Toast.info("请选择认可对象");
      return;
    }
    if (!message.trim()) {
      Toast.info("请填写认可留言");
      return;
    }
    setSubmitting(true);
    try {
      await post("/recognition", { receiverId, badgeId: badgeId || undefined, message: message.trim() });
      Toast.success("认可已发送！");
      navigate("/home");
    } catch {
      Toast.info("发送失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-4 pt-4 pb-20">
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-700">认可对象</h3>
          <div className="max-h-40 overflow-y-auto">
            {users.map((u) => (
              <button
                key={u.id}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${receiverId === u.id ? "bg-blue-50 text-blue-600" : "text-gray-700"}`}
                onClick={() => setReceiverId(u.id)}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-700">选择徽章（可选）</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <button
                key={b.id}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs ${badgeId === b.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setBadgeId(badgeId === b.id ? "" : b.id)}
              >
                {b.icon && <img src={b.icon} className="h-4 w-4 rounded-full" />}
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-700">认可留言</h3>
          <Textarea
            placeholder="写下你对 ta 的认可..."
            value={message}
            onChange={(_e, val) => setMessage(val)}
            maxLength={500}
            rows={4}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{message.length}/500</p>
        </div>

        <button
          className={`w-full rounded-xl py-3 text-sm font-medium text-white ${submitting ? "bg-gray-300" : "bg-blue-500 active:bg-blue-600"}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "发送中..." : "发送认可"}
        </button>
      </div>
    </div>
  );
}
