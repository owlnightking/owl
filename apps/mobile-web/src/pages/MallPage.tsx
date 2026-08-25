import { NavBar, Toast } from "@arco-design/mobile-react";
import { mockProducts, mockUser } from "../data/mock";

function ProductCard({ product, onExchange }: { product: (typeof mockProducts)[0]; onExchange: (id: string) => void }) {
  const canExchange = mockUser.recognitionCoins >= product.price;

  return (
    <div className="mb-3 overflow-hidden rounded-xl bg-white shadow-sm">
      <img src={product.image} alt={product.name} className="h-40 w-full object-cover" />
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800">{product.name}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-orange-500">{product.price} 币</span>
          <span className="text-xs text-gray-400">库存 {product.stock}</span>
        </div>
        <button
          className={`mt-2 w-full rounded-lg py-1.5 text-xs font-medium text-white ${
            canExchange ? "bg-blue-500 active:bg-blue-600" : "bg-gray-300"
          }`}
          onClick={() => onExchange(product.id)}
          disabled={!canExchange}
        >
          {canExchange ? "立即兑换" : "币不足"}
        </button>
      </div>
    </div>
  );
}

export function MallPage() {
  const handleExchange = (_id: string) => {
    Toast.success("兑换成功！");
  };

  return (
    <div className="min-h-dvh bg-gray-100">
      <NavBar title="兑换商城" />
      <div className="px-3 pt-14 pb-20">
        <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">我的认可币</span>
            <span className="text-lg font-semibold text-orange-500">{mockUser.recognitionCoins}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} onExchange={handleExchange} />
          ))}
        </div>
      </div>
    </div>
  );
}
