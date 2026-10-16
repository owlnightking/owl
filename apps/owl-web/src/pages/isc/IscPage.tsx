/**
 * ISC 模块 —— 供应商 / 报价 / 生产批次 / 头程物流 四页签。
 *
 * 金额口径：人民币录入（报价、头程成本）→ 后端按汇率快照折算美元，主展示美元副原币；
 * 生产、发货数量为纯数量无金额。报价挂供应商（可选产品线/SPU）；生产批次挂 SPU + 供应商。
 */
import { Tabs } from "@arco-design/web-react";
import { ProductionTab } from "../../components/isc-tabs/ProductionTab";
import { QuoteTab } from "../../components/isc-tabs/QuoteTab";
import { ShipmentTab } from "../../components/isc-tabs/ShipmentTab";
import { SupplierTab } from "../../components/isc-tabs/SupplierTab";

export function IscPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">ISC 供应链</h1>
      </div>
      <Tabs>
        <Tabs.TabPane key="suppliers" title="供应商">
          <SupplierTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="quotes" title="报价">
          <QuoteTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="productions" title="生产批次">
          <ProductionTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="shipments" title="头程物流">
          <ShipmentTab />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
