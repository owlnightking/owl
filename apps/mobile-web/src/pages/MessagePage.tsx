import { IconNotice, IconSuccessCircle } from "@arco-design/mobile-react/esm/icon";
import { mockMessages, type MessageItem } from "../data/messages";

function MessageCard({ item }: { item: MessageItem }) {
  const typeIcon = item.type === "system" ? <IconNotice /> : <IconSuccessCircle />;
  const typeColor = item.type === "system" ? "bg-blue-100" : "bg-green-100";

  return (
    <div className={`mb-3 rounded-xl p-4 shadow-sm ${item.isRead ? "bg-white" : "bg-blue-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${typeColor}`}>
          <span className="text-lg">{typeIcon}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">{item.title}</h3>
            {!item.isRead && <span className="h-2 w-2 rounded-full bg-red-500" />}
          </div>
          <p className="mt-1 text-sm text-gray-600">{item.content}</p>
          <p className="mt-2 text-xs text-gray-400">{item.time}</p>
        </div>
      </div>
    </div>
  );
}

export function MessagePage() {
  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-4 pt-4 pb-20">
        {mockMessages.map((item) => (
          <MessageCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
