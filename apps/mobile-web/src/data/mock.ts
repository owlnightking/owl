export interface RecognitionItem {
  id: string;
  badge: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  recognitionCoins: number;
  level: number;
  exp: number;
  nextLevelExp: number;
  stamina: number;
  maxStamina: number;
}

export interface ExchangeProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
}

export const mockUser: UserProfile = {
  id: "1",
  name: "张三",
  avatar: "",
  recognitionCoins: 1280,
  level: 3,
  exp: 2400,
  nextLevelExp: 3600,
  stamina: 350,
  maxStamina: 500,
};

export const mockRecognitions: RecognitionItem[] = [
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
];

export const mockProducts: ExchangeProduct[] = [
  { id: "1", name: "定制笔记本", image: "https://via.placeholder.com/150", price: 200, stock: 50 },
  { id: "2", name: "品牌保温杯", image: "https://via.placeholder.com/150", price: 350, stock: 30 },
  { id: "3", name: "无线充电器", image: "https://via.placeholder.com/150", price: 500, stock: 20 },
  { id: "4", name: "蓝牙耳机", image: "https://via.placeholder.com/150", price: 800, stock: 15 },
  { id: "5", name: "机械键盘", image: "https://via.placeholder.com/150", price: 1200, stock: 10 },
  { id: "6", name: "显示器支架", image: "https://via.placeholder.com/150", price: 600, stock: 25 },
  { id: "7", name: "办公鼠标", image: "https://via.placeholder.com/150", price: 300, stock: 40 },
  { id: "8", name: "USB扩展坞", image: "https://via.placeholder.com/150", price: 450, stock: 35 },
];
