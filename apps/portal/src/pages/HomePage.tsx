import { useState, useEffect } from "react";
import { Notification } from "@arco-design/web-react";
import {
  IconSettings,
  IconDesktop,
  IconClockCircle,
  IconApps,
  IconHeart,
  IconMessage,
} from "@arco-design/web-react/icon";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@owl/permission";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ""}`} />;
}

function HomePageSkeleton() {
  return (
    <div className="flex h-full gap-4 bg-gray-50 p-4">
      <div className="flex min-w-0 flex-[2] flex-col gap-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white px-4 pb-3 pt-4">
          <SkeletonBlock className="mb-2 h-4 w-20" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
                <SkeletonBlock className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-32" />
                  <SkeletonBlock className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white px-4 pb-4 pt-4">
          <SkeletonBlock className="mb-3 h-4 w-20" />
          <div className="grid grid-cols-5 gap-x-3 gap-y-14">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="flex h-[90px] w-[90px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-100"
              >
                <SkeletonBlock className="h-7 w-7 rounded" />
                <SkeletonBlock className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-[1] min-h-0 flex-col overflow-hidden rounded-lg bg-white px-4 pb-3 pt-4">
        <SkeletonBlock className="mb-2 h-4 w-20" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-gray-50 p-4">
              <div className="flex gap-3">
                <SkeletonBlock className="h-14 w-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const APP_ICONS: Record<string, React.ReactNode> = {
  admin: <IconSettings style={{ fontSize: 28 }} />,
  owl: <IconDesktop style={{ fontSize: 28 }} />,
  cron: <IconClockCircle style={{ fontSize: 28 }} />,
};

const APP_COLORS: Record<string, { bg: string; icon: string }> = {
  admin: { bg: "bg-blue-50", icon: "text-blue-500" },
  owl: { bg: "bg-green-50", icon: "text-green-500" },
  cron: { bg: "bg-purple-50", icon: "text-purple-500" },
};

interface NoticeItem {
  id: string;
  icon: string;
  title: string;
  content: string;
  createdAt: string;
}

const MOCK_NOTICES: NoticeItem[] = [
  {
    id: "1",
    icon: "https://via.placeholder.com/32",
    title: "系统升级通知",
    content: "系统将于今晚22:00进行升级维护，预计持续2小时。",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    icon: "https://via.placeholder.com/32",
    title: "新功能上线",
    content: "认功能已正式上线，欢迎大家使用并反馈意见。",
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    icon: "https://via.placeholder.com/32",
    title: "春节放假通知",
    content: "公司春节放假时间为2月5日至2月18日，请提前安排好工作。",
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    icon: "https://via.placeholder.com/32",
    title: "团建活动通知",
    content: "本月团建活动定于下周六，地点待定，请大家踊跃报名。",
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    icon: "https://via.placeholder.com/32",
    title: "新员工入职",
    content: "欢迎新同事加入团队，请大家多多关照。",
    createdAt: "2024-01-11",
  },
];

interface RecognitionItem {
  id: string;
  badge: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

const MOCK_RECOGNITIONS: RecognitionItem[] = [
  {
    id: "1",
    badge: "https://via.placeholder.com/80",
    title: "优秀团队协作",
    content: "在本次项目中展现了卓越的团队协作能力，帮助新成员快速融入，主动承担困难任务。",
    likes: 12,
    comments: 3,
    isLiked: false,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    badge: "https://via.placeholder.com/80",
    title: "创新解决方案",
    content: "提出了创新的技术方案，解决了长期存在的性能问题，系统响应速度提升50%。",
    likes: 28,
    comments: 7,
    isLiked: true,
    createdAt: "2024-01-14",
  },
  {
    id: "3",
    badge: "https://via.placeholder.com/80",
    title: "客户满意度提升",
    content: "通过细致的沟通和高效的问题解决，客户满意度从85%提升到95%。",
    likes: 45,
    comments: 12,
    isLiked: false,
    createdAt: "2024-01-13",
  },
  {
    id: "4",
    badge: "https://via.placeholder.com/80",
    title: "代码质量标兵",
    content: "坚持编写高质量代码，Code Review 中多次发现潜在问题，代码覆盖率保持在90%以上。",
    likes: 19,
    comments: 5,
    isLiked: false,
    createdAt: "2024-01-12",
  },
  {
    id: "5",
    badge: "https://via.placeholder.com/80",
    title: "知识分享达人",
    content: "主动组织技术分享会，编写详细的技术文档，帮助团队成员共同成长。",
    likes: 33,
    comments: 8,
    isLiked: true,
    createdAt: "2024-01-11",
  },
  {
    id: "6",
    badge: "https://via.placeholder.com/80",
    title: "高效项目交付",
    content: "项目提前两周交付，质量超出预期，获得客户高度认可。",
    likes: 42,
    comments: 10,
    isLiked: false,
    createdAt: "2024-01-10",
  },
  {
    id: "7",
    badge: "https://via.placeholder.com/80",
    title: "流程优化专家",
    content: "优化了部门工作流程，效率提升30%，节省大量人力成本。",
    likes: 56,
    comments: 15,
    isLiked: true,
    createdAt: "2024-01-09",
  },
  {
    id: "8",
    badge: "https://via.placeholder.com/80",
    title: "新人成长之星",
    content: "入职三个月快速成长，独立完成核心模块开发，表现优秀。",
    likes: 23,
    comments: 6,
    isLiked: false,
    createdAt: "2024-01-08",
  },
  {
    id: "9",
    badge: "https://via.placeholder.com/80",
    title: "技术难题攻克",
    content: "攻克了困扰团队数月的技术难题，展现了扎实的技术功底。",
    likes: 67,
    comments: 20,
    isLiked: false,
    createdAt: "2024-01-07",
  },
  {
    id: "10",
    badge: "https://via.placeholder.com/80",
    title: "跨部门协作典范",
    content: "主动协调多个部门资源，推动项目顺利落地，体现卓越的协作精神。",
    likes: 38,
    comments: 9,
    isLiked: true,
    createdAt: "2024-01-06",
  },
];

function NoticeCard({ item }: { item: NoticeItem }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50">
      <img
        src={
          imgError
            ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect fill='%23dbeafe' width='32' height='32' rx='4'/%3E%3C/svg%3E"
            : item.icon
        }
        alt=""
        className="mt-0.5 h-8 w-8 flex-shrink-0 rounded object-cover"
        onError={() => setImgError(true)}
      />
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-gray-800">{item.title}</h4>
        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.content}</p>
      </div>
      <span className="flex-shrink-0 text-xs text-gray-400">{item.createdAt}</span>
    </div>
  );
}

function RecognitionCard({ item, onLike }: { item: RecognitionItem; onLike: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const fallbackSrc =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23e5e7eb' width='80' height='80'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3E徽章%3C/text%3E%3C/svg%3E";

  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex gap-3">
        <img
          src={imgError ? fallbackSrc : item.badge}
          alt="徽章"
          className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
          onError={() => setImgError(true)}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-600">{item.content}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 border-t border-gray-200 pt-3">
        <button
          className={`flex items-center gap-1 text-sm ${item.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-400"}`}
          onClick={() => onLike(item.id)}
        >
          <IconHeart />
          <span>{item.likes}</span>
        </button>
        <button className="flex items-center gap-1 text-sm text-gray-500">
          <IconMessage />
          <span>{item.comments}</span>
        </button>
        <span className="ml-auto text-xs text-gray-400">{item.createdAt}</span>
      </div>
    </div>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [recognitions, setRecognitions] = useState(MOCK_RECOGNITIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <HomePageSkeleton />;
  }

  const handleLike = (id: string) => {
    setRecognitions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.isLiked) {
            Notification.info({ title: "提示", content: "已取消点赞" });
            return { ...item, likes: item.likes - 1, isLiked: false };
          }
          Notification.success({ title: "操作成功", content: "点赞成功" });
          return { ...item, likes: item.likes + 1, isLiked: true };
        }
        return item;
      })
    );
  };

  return (
    <div className="flex h-full gap-4 bg-gray-50 p-4">
      {/* 左侧 2/3：上下布局 5:5 */}
      <div className="flex min-w-0 flex-[2] flex-col gap-3">
        {/* 上：通知 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white px-4 pb-3 pt-4">
          <h2
            className="mb-2 flex flex-shrink-0 items-center text-sm font-bold text-gray-500"
            style={{ borderLeft: "3px solid #3370ff", paddingLeft: 10 }}
          >
            企业通知
          </h2>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {MOCK_NOTICES.map((item) => (
              <NoticeCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* 下：应用 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white px-4 pb-4 pt-4">
          <h2
            className="mb-3 flex flex-shrink-0 items-center text-sm font-bold text-gray-500"
            style={{ borderLeft: "3px solid #3370ff", paddingLeft: 10 }}
          >
            系统模块
          </h2>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-x-3 gap-y-14">
              {APP_ROUTES.map((app) => {
                const colors = APP_COLORS[app.app] ?? { bg: "bg-gray-50", icon: "text-gray-500" };
                return (
                  <button
                    key={app.app}
                    onClick={() => navigate(`/${app.app}`)}
                    className={`flex h-[90px] w-[90px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-100 transition-all hover:shadow-md ${colors.bg}`}
                  >
                    <span className={colors.icon}>{APP_ICONS[app.app] ?? <IconApps style={{ fontSize: 28 }} />}</span>
                    <span className="text-xs font-medium text-gray-700">{app.name}</span>
                  </button>
                );
              })}
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className="h-[90px] w-[90px] rounded-xl border border-dashed border-gray-200"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 1/3：动态 */}
      <div className="flex min-w-0 flex-[1] min-h-0 flex-col overflow-hidden rounded-lg bg-white px-4 pb-3 pt-4">
        <h2
          className="mb-2 flex flex-shrink-0 items-center text-sm font-bold text-gray-500"
          style={{ borderLeft: "3px solid #3370ff", paddingLeft: 10 }}
        >
          认可动态
        </h2>
        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {recognitions.map((item) => (
            <RecognitionCard key={item.id} item={item} onLike={handleLike} />
          ))}
        </div>
      </div>
    </div>
  );
}
