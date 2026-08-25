import { NavBar } from "@arco-design/mobile-react";
import { mockUser } from "../data/mock";

export function ProfilePage() {
  const expPercent = Math.round((mockUser.exp / mockUser.nextLevelExp) * 100);

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="我的" />
      <div className="px-4 pt-14 pb-20">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{mockUser.name}</h2>
              <p className="text-sm text-gray-500">
                入职 {mockUser.level} 年 · Lv.{mockUser.level}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">认可币余额</span>
            <span className="text-2xl font-bold text-orange-500">{mockUser.recognitionCoins}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">等级经验</span>
            <span className="text-sm text-gray-500">
              {mockUser.exp} / {mockUser.nextLevelExp}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div className="h-2.5 rounded-full bg-blue-500 transition-all" style={{ width: `${expPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-400">每月自动增加经验，一年升一级</p>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">本月剩余体力</span>
            <span className="text-lg font-semibold text-green-500">
              {mockUser.stamina} / {mockUser.maxStamina}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">点赞消耗体力，每月重置</p>
        </div>
      </div>
    </div>
  );
}
