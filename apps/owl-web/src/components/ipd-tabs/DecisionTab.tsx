import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Notification, Select, Skeleton } from "@arco-design/web-react";
import { get, put } from "../../api/client";
import { INVEST_RESULT_LABELS, type InvestDecisionItem, toDateOnly } from "../../api/pipeline";
import { notifyError } from "./notify";

export function DecisionTab({ productLineId, onChanged }: { productLineId: number; onChanged: () => Promise<void> }) {
  const [record, setRecord] = useState<InvestDecisionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<InvestDecisionItem | null>(`/ipd/product-lines/${productLineId}/decision`);
      setRecord(result);
      if (result) {
        form.setFieldsValue(result);
      }
    } catch (error) {
      notifyError(error, "加载失败");
    } finally {
      setLoading(false);
    }
  }, [productLineId, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    try {
      const values = await form.validate();
      await put(`/ipd/product-lines/${productLineId}/decision`, values);
      Notification.success({ title: "成功", content: "投决记录已保存" });
      await load();
      await onChanged();
    } catch (error) {
      if (error instanceof Error && error.message && !error.message.includes("validate")) return;
      Notification.error({ title: "失败", content: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton text={{ rows: 4 }} />;
  }

  return (
    <div className="flex max-w-xl flex-col gap-3">
      <Form form={form} layout="vertical">
        <Form.Item label="GTM 反馈摘要" field="gtmFeedbackSummary">
          <Input.TextArea placeholder="社群期待度 / 预热播放量" />
        </Form.Item>
        <Form.Item label="ISC 供应情况摘要" field="iscSummary">
          <Input.TextArea placeholder="报价 / 交期 / 工艺确认" />
        </Form.Item>
        <Form.Item label="目标定价（美元）" field="targetPriceUsd">
          <InputNumber placeholder="59.99" min={0} className="w-full" />
        </Form.Item>
        <Form.Item label="单位成本（美元）" field="unitCostUsd">
          <InputNumber placeholder="18.5" min={0} className="w-full" />
        </Form.Item>
        <Form.Item label="投决结果" field="result" rules={[{ required: true, message: "请选择投决结果" }]}>
          <Select placeholder="待决策">
            {Object.entries(INVEST_RESULT_LABELS).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="备注" field="notes">
          <Input.TextArea placeholder="通过后的行动项" />
        </Form.Item>
      </Form>
      {record && <p className="m-0 text-xs text-gray-400">最近更新：{toDateOnly(record.updatedAt)}</p>}
      <div>
        <Button type="primary" loading={saving} onClick={() => void submit()}>
          保存
        </Button>
      </div>
    </div>
  );
}
