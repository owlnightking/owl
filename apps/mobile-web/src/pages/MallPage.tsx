import { useEffect, useState } from "react";
import { Toast } from "@arco-design/mobile-react";
import { get, post } from "../api/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  enabled: boolean;
}
interface CoinAccount {
  balance: number;
}

function ProductCard({
  product,
  myBalance,
  onExchange,
}: {
  product: Product;
  myBalance: number;
  onExchange: (id: string) => void;
}) {
  const canExchange = myBalance >= product.price && product.stock > 0;
  return (
    <div className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
      {product.image ? (
        <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gray-100 flex items-center justify-center text-gray-300">暂无图片</div>
      )}
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800">{product.name}</h3>
        {product.description && <p className="mt-1 text-xs text-gray-400 line-clamp-2">{product.description}</p>}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-orange-500">{product.price} 币</span>
          <span className="text-xs text-gray-400">库存 {product.stock}</span>
        </div>
        <button
          className={`mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-white ${canExchange ? "bg-blue-500 active:bg-blue-600" : "bg-gray-300"}`}
          onClick={() => onExchange(product.id)}
          disabled={!canExchange}
        >
          {!product.stock ? "已售罄" : canExchange ? "立即兑换" : "币不足"}
        </button>
      </div>
    </div>
  );
}

export function MallPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, bRes] = await Promise.all([
        get<{ items: Product[] }>("/recognition/products", { pageSize: "50" }),
        get<CoinAccount>("/recognition/exchange/coin-account"),
      ]);
      setProducts(pRes.items);
      setBalance(bRes.balance);
    } catch {
      Toast.info("加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExchange = async (productId: string) => {
    try {
      await post("/recognition/exchange/orders", { productId, quantity: 1 });
      Toast.success("兑换成功！");
      fetchData();
    } catch {
      Toast.info("兑换失败");
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">加载中...</div>;

  return (
    <div className="min-h-dvh bg-gray-100">
      <div className="px-3 pt-4 pb-20">
        <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">我的认可币</span>
            <span className="text-lg font-semibold text-orange-500">{balance}</span>
          </div>
        </div>
        <div>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} myBalance={balance} onExchange={handleExchange} />
          ))}
          {products.length === 0 && <div className="py-8 text-center text-gray-400 text-sm">暂无商品</div>}
        </div>
      </div>
    </div>
  );
}
