import { useState } from "react";
import { Toast } from "@arco-design/mobile-react";
import { IconHeart, IconNotice } from "@arco-design/mobile-react/esm/icon";
import { mockRecognitions, type RecognitionItem } from "../data/mock";

function RecognitionCard({ item, onLike }: { item: RecognitionItem; onLike: (id: string) => void }) {
  return (
    <div className="mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <img src={item.badge} alt="徽章" className="h-20 w-20 flex-shrink-0 rounded-lg object-cover" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{item.title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.content}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3">
        <button
          className={`flex items-center gap-1 text-sm ${item.isLiked ? "text-red-500" : "text-gray-500"}`}
          onClick={() => onLike(item.id)}
        >
          <span className={item.isLiked ? "text-red-500" : "text-gray-400"}>
            <IconHeart />
          </span>
          <span>{item.likes}</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-gray-500">
          <span>
            <IconNotice />
          </span>
          <span>{item.comments}</span>
        </button>
        <span className="ml-auto text-xs text-gray-400">{item.createdAt}</span>
      </div>
    </div>
  );
}

export function RecognitionFeed() {
  const [recognitions, setRecognitions] = useState(mockRecognitions);

  const handleLike = (id: string) => {
    setRecognitions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.isLiked) {
            Toast.info("已取消点赞");
            return { ...item, likes: item.likes - 1, isLiked: false };
          }
          Toast.success("点赞成功，消耗10体力");
          return { ...item, likes: item.likes + 1, isLiked: true };
        }
        return item;
      })
    );
  };

  return (
    <div>
      {recognitions.map((item) => (
        <RecognitionCard key={item.id} item={item} onLike={handleLike} />
      ))}
    </div>
  );
}
