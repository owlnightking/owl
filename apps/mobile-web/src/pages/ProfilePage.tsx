import { useEffect, useState } from "react";
import { Toast } from "@arco-design/mobile-react";
import { get } from "../api/client";

interface MeData {
  id: string;
  name: string;
  avatarUrl: string | null;
}
interface CoinAccount {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}
interface StaminaAccount {
  current: number;
  max: number;
}
interface LevelData {
  level: number;
  exp: number;
  nextLevelExp: number;
}
interface ExchangeOrder {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  totalCost: number;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "text-orange-500" },
  approved: { label: "已通过", color: "text-green-500" },
  rejected: { label: "已驳回", color: "text-red-500" },
  fulfilled: { label: "已核销", color: "text-blue-500" },
};

export function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [coin, setCoin] = useState<CoinAccount>({ balance: 0, totalEarned: 0, totalSpent: 0 });
  const [stamina, setStamina] = useState<StaminaAccount>({ current: 0, max: 500 });
  const [level, setLevel] = useState<LevelData>({ level: 1, exp: 0, nextLevelExp: 1000 });
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, coinRes, staminaRes, levelRes, orderRes] = await Promise.all([
          get<MeData>("/auth/me"),
          get<CoinAccount>("/recognition/exchange/coin-account"),
          get<StaminaAccount>("/recognition/exchange/stamina"),
          get<LevelData>("/recognition/level"),
          get<{ items: ExchangeOrder[] }>("/recognition/exchange/orders", { pageSize: "20" }),
        ]);
        setMe(meRes);
        setCoin(coinRes);
        setStamina(staminaRes);
        setLevel(levelRes);
        setOrders(orderRes.items);
      } catch {
        Toast.info("加载失败");
      }
    })();
  }, []);

  const expPercent = level.nextLevelExp ? Math.round((level.exp / level.nextLevelExp) * 100) : 0;

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-4 pt-4 pb-20">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl text-blue-500">{me?.name?.charAt(0) || "?"}</span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{me?.name || "加载中"}</h2>
              <p className="text-sm text-gray-500">Lv.{level.level}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">认可币余额</span>
            <span className="text-2xl font-bold text-orange-500">{coin.balance}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-400">
            <span>累计获得 {coin.totalEarned}</span>
            <span>累计消耗 {coin.totalSpent}</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">等级经验</span>
            <span className="text-sm text-gray-500">
              {level.exp} / {level.nextLevelExp}
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
              {stamina.current} / {stamina.max}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-400">点赞消耗体力，每月重置</p>
        </div>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-gray-700">兑换记录</h3>
          {orders.length === 0 ? (
            <p className="py-4 text-center text-xs text-gray-400">暂无记录</p>
          ) : (
            orders.map((o) => {
              const s = STATUS_MAP[o.status] ?? { label: o.status, color: "text-gray-500" };
              return (
                <div key={o.id} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
                  {o.productImage ? (
                    <img src={o.productImage} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-100" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{o.productName}</p>
                    <p className="text-xs text-gray-400">{o.createdAt?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-500">-{o.totalCost} 币</p>
                    <p className={`text-xs ${s.color}`}>{s.label}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
