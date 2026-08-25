import { NavBar } from "@arco-design/mobile-react";
import { RecognitionFeed } from "../components/RecognitionFeed";

export function HomePage() {
  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="认可圈" />
      <div className="px-4 pt-14 pb-20">
        <RecognitionFeed />
      </div>
    </div>
  );
}
