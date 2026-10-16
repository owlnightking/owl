/**
 * GTM 模块 —— 投放活动 / KOL / 社群反馈 / 预售批次 四页签。
 *
 * 金额以美元为主展示。campaign 创建需绑定产品线（ID 输入）；预售绑定 SPU。
 */
import { Tabs } from "@arco-design/web-react";
import { CampaignTab } from "../../components/gtm-tabs/CampaignTab";
import { FeedbackTab } from "../../components/gtm-tabs/FeedbackTab";
import { KolTab } from "../../components/gtm-tabs/KolTab";
import { PresaleTab } from "../../components/gtm-tabs/PresaleTab";

export function GtmPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">GTM 增长</h1>
      </div>
      <Tabs>
        <Tabs.TabPane key="campaigns" title="投放活动">
          <CampaignTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="kols" title="KOL">
          <KolTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="feedbacks" title="社群反馈">
          <FeedbackTab />
        </Tabs.TabPane>
        <Tabs.TabPane key="presales" title="预售批次">
          <PresaleTab />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
