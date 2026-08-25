import { useLocation, useNavigate } from "react-router-dom";
import { IconHome, IconNotice, IconShopping, IconUser } from "@arco-design/mobile-react/esm/icon";

const tabs = [
  { path: "/home", label: "首页", icon: <IconHome /> },
  { path: "/message", label: "消息", icon: <IconNotice /> },
  { path: "/mall", label: "商城", icon: <IconShopping /> },
  { path: "/profile", label: "我的", icon: <IconUser /> },
];

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              className={`flex flex-col items-center gap-0.5 ${isActive ? "text-blue-500" : "text-gray-500"}`}
              onClick={() => navigate(tab.path)}
            >
              <span className="text-lg flex items-center">{tab.icon}</span>
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
