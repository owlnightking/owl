import { useEffect, useState } from "react";
import { Toast, NavBar, Cell, Progress, Grid } from "@arco-design/mobile-react";
import { IconUser, IconSetting, IconQuestionCircle, IconNotice } from "@arco-design/mobile-react/esm/icon";
import { get } from "../api/client";

interface MeData {
  name: string;
  avatarUrl: string | null;
}
interface CoinAccount {
  balance: number;
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

const APP_VERSION = "0.1.0";

const quickAccessItems = [
  { icon: <IconUser />, label: "个人信息" },
  { icon: <IconNotice />, label: "认可记录" },
  { icon: <IconSetting />, label: "系统设置" },
  { icon: <IconQuestionCircle />, label: "问题反馈" },
];

export function ProfilePage() {
  const [me, setMe] = useState<MeData | null>(null);
  const [coin, setCoin] = useState<CoinAccount>({ balance: 0 });
  const [stamina, setStamina] = useState<StaminaAccount>({ current: 0, max: 500 });
  const [level, setLevel] = useState<LevelData>({ level: 1, exp: 0, nextLevelExp: 1000 });
  const [showLevelTip, setShowLevelTip] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, coinRes, staminaRes, levelRes] = await Promise.all([
          get<MeData>("/auth/me"),
          get<CoinAccount>("/recognition/exchange/coin-account"),
          get<StaminaAccount>("/recognition/exchange/stamina"),
          get<LevelData>("/recognition/level"),
        ]);
        setMe(meRes);
        setCoin(coinRes);
        setStamina(staminaRes);
        setLevel(levelRes);
      } catch {
        Toast.info("加载失败");
      }
    })();
  }, []);

  const expPercent = level.nextLevelExp ? Math.round((level.exp / level.nextLevelExp) * 100) : 0;

  const gridData = [
    ...quickAccessItems.map((item) => ({
      img: (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl text-gray-500">
          {item.icon}
        </div>
      ),
      title: <span className="text-xs text-gray-600">{item.label}</span>,
    })),
    ...Array.from({ length: 2 }, () => ({
      img: (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-gray-300 text-xl text-gray-300">
          +
        </div>
      ),
      title: <span className="text-xs text-gray-300">-</span>,
    })),
  ];

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="我的" />
      <div className="px-4 pt-4 pb-20">
        <div className="mb-4 rounded-xl bg-white p-4 shadow-sm">
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
              <p className="text-xs text-gray-400">员工</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">Lv.{level.level}</p>
              <p className="mt-1 text-xs text-gray-400">等级</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stamina.current}</p>
              <p className="mt-1 text-xs text-gray-400">本月体力</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{coin.balance}</p>
              <p className="mt-1 text-xs text-gray-400">认可币</p>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">等级经验</span>
                <span className="relative ml-4">
                  <button
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] text-gray-500"
                    onClick={() => setShowLevelTip(!showLevelTip)}
                  >
                    ?
                  </button>
                  {showLevelTip && (
                    <span className="absolute left-6 top-0 z-10 w-40 rounded-lg bg-gray-800 px-3 py-2 text-xs text-white shadow-lg">
                      每月自动增加经验，一年升一级
                    </span>
                  )}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {level.exp} / {level.nextLevelExp}
              </span>
            </div>
            <Progress percentage={expPercent} showPercent={false} />
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white shadow-sm overflow-hidden">
          <Cell icon={<IconUser />} label="个人信息" showArrow />
          <Cell icon={<IconQuestionCircle />} label="问题反馈" showArrow />
          <Cell icon={<IconSetting />} label="系统设置" showArrow />
        </div>

        <div className="mb-4 rounded-xl bg-white shadow-sm overflow-hidden">
          <Grid columns={3} gutter={8} data={gridData} className="p-4" />
        </div>

        <p className="text-center text-xs text-gray-300">OWL v{APP_VERSION}</p>
      </div>
    </div>
  );
}
