import { useNavigate } from "react-router-dom";
import { RecognitionFeed } from "../components/RecognitionFeed";

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-4 pt-4 pb-20">
        <RecognitionFeed />
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
