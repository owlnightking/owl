/**
 * 产品线详情 —— IPD 五期推进 + 各阶段记录页签装配。
 *
 * 结构：头部（返回/名称 h1/生命周期调整）→ 阶段推进条 → 页签。
 * 各页签实现拆分于 ../../components/ipd-tabs/（机会判断 / 立项 / 定型 / 投决 / 经营复盘 / SPU·SKU），
 * 列表类页签内部按样板结构落地；本页整页加载用 Skeleton（第六节局部/整页加载态规范）。
 */
import { useCallback, useEffect, useState } from "react";
import { Button, Notification, Select, Skeleton, Tabs, Tag } from "@arco-design/web-react";
import { IconLeft, IconRight } from "@arco-design/web-react/icon";
import { useNavigate, useParams } from "react-router-dom";
import { get, put } from "../../api/client";
import {
  IPD_STAGE_LABELS,
  IPD_STAGE_ORDER,
  LIFECYCLE_STAGE_OPTIONS,
  type ProductLineItem,
  ipdStageLabel,
  lifecycleStageLabel,
} from "../../api/pipeline";
import { ResearchTab } from "../../components/ipd-tabs/ResearchTab";
import { DesignTaskTab } from "../../components/ipd-tabs/DesignTaskTab";
import { PrototypeTab } from "../../components/ipd-tabs/PrototypeTab";
import { DecisionTab } from "../../components/ipd-tabs/DecisionTab";
import { ReviewTab } from "../../components/ipd-tabs/ReviewTab";
import { SpuTab } from "../../components/ipd-tabs/SpuTab";

export function ProductLineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productLineId = Number(id);
  const [detail, setDetail] = useState<ProductLineItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("research");
  const [lifecycleDraft, setLifecycleDraft] = useState<string | undefined>(undefined);
  const [stageBusy, setStageBusy] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(productLineId)) return;
    setLoading(true);
    try {
      const result = await get<ProductLineItem>(`/ipd/product-lines/${productLineId}`);
      setDetail(result);
      setLifecycleDraft(result.lifecycleStage);
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "加载失败" });
    } finally {
      setLoading(false);
    }
  }, [productLineId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const advanceStage = async (target: string) => {
    setStageBusy(true);
    try {
      await put(`/ipd/product-lines/${productLineId}/stages`, { ipdStage: target });
      Notification.success({ title: "成功", content: `已推进到「${ipdStageLabel(target)}」` });
      await loadDetail();
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "阶段推进失败" });
    } finally {
      setStageBusy(false);
    }
  };

  const changeLifecycle = async (value: string) => {
    setLifecycleDraft(value);
    try {
      await put(`/ipd/product-lines/${productLineId}/stages`, { lifecycleStage: value });
      Notification.success({ title: "成功", content: `生命周期已调整为「${lifecycleStageLabel(value)}」` });
      await loadDetail();
    } catch (error) {
      Notification.error({ title: "失败", content: error instanceof Error ? error.message : "生命周期调整失败" });
      if (detail) setLifecycleDraft(detail.lifecycleStage);
    }
  };

  if (loading || !detail) {
    return <Skeleton text={{ rows: 8 }} />;
  }

  const currentIndex = IPD_STAGE_ORDER.indexOf(detail.ipdStage as (typeof IPD_STAGE_ORDER)[number]);
  const nextStage =
    currentIndex >= 0 && currentIndex < IPD_STAGE_ORDER.length - 1 ? IPD_STAGE_ORDER[currentIndex + 1] : null;
  const prevStage = currentIndex > 0 ? IPD_STAGE_ORDER[currentIndex - 1] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="text" size="small" icon={<IconLeft />} onClick={() => navigate("/ipd")}>
            返回列表
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">
            {detail.name}
            <span className="ml-2 text-sm font-normal text-gray-400">{detail.code}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">生命周期</span>
          <Select className="w-28" value={lifecycleDraft} onChange={(value) => void changeLifecycle(value)}>
            {LIFECYCLE_STAGE_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {detail.targetMarket && <p className="m-0 text-xs text-gray-400">目标市场：{detail.targetMarket}</p>}
      {detail.styleDesc && <p className="m-0 text-xs text-gray-400">风格：{detail.styleDesc}</p>}

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3">
        {IPD_STAGE_ORDER.map((stage, index) => (
          <div key={stage} className="flex items-center gap-2">
            <Tag
              color={stage === detail.ipdStage ? "blue" : index < currentIndex ? "green" : "gray"}
              className="cursor-default"
            >
              {IPD_STAGE_LABELS[stage]}
            </Tag>
            {index < IPD_STAGE_ORDER.length - 1 && <IconRight className="text-gray-300" />}
          </div>
        ))}
        <div className="grow" />
        {prevStage && (
          <Button size="small" disabled={stageBusy} onClick={() => void advanceStage(prevStage)}>
            回退到「{IPD_STAGE_LABELS[prevStage]}」
          </Button>
        )}
        {nextStage && (
          <Button type="primary" size="small" loading={stageBusy} onClick={() => void advanceStage(nextStage)}>
            推进到「{IPD_STAGE_LABELS[nextStage]}」
          </Button>
        )}
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane key="research" title="机会判断（调研）">
          <ResearchTab productLineId={productLineId} />
        </Tabs.TabPane>
        <Tabs.TabPane key="design" title="立项（设计任务）">
          <DesignTaskTab productLineId={productLineId} />
        </Tabs.TabPane>
        <Tabs.TabPane key="prototype" title="定型（手办样）">
          <PrototypeTab productLineId={productLineId} onChanged={loadDetail} />
        </Tabs.TabPane>
        <Tabs.TabPane key="decision" title="投决">
          <DecisionTab productLineId={productLineId} onChanged={loadDetail} />
        </Tabs.TabPane>
        <Tabs.TabPane key="review" title="经营复盘">
          <ReviewTab productLineId={productLineId} />
        </Tabs.TabPane>
        <Tabs.TabPane key="spu" title="SPU / SKU">
          <SpuTab productLineId={productLineId} onChanged={loadDetail} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
