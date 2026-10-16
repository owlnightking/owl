import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Notification, Skeleton, Switch } from "@arco-design/web-react";
import { get, put } from "../../api/client";
import type { PrototypeReviewItem } from "../../api/pipeline";
import { toDateOnly } from "../../api/pipeline";
import { notifyError } from "./notify";

export function PrototypeTab({ productLineId, onChanged }: { productLineId: number; onChanged: () => Promise<void> }) {
  const [record, setRecord] = useState<PrototypeReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await get<PrototypeReviewItem | null>(`/ipd/product-lines/${productLineId}/prototype`);
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
      await put(`/ipd/product-lines/${productLineId}/prototype`, values);
      Notification.success({ title: "成功", content: "手办样评审记录已保存" });
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
        <Form.Item label="手办样完成" field="sampleReady" triggerPropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="内部评审通过" field="reviewPassed" triggerPropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item label="评审记录" field="reviewNotes">
          <Input.TextArea placeholder="结构强度 / 成本 / 观感结论" />
        </Form.Item>
        <Form.Item label="推送 GTM 共建" field="sharedWithGtm" triggerPropName="checked">
          <Switch />
        </Form.Item>
      </Form>
      {record && (
        <p className="m-0 text-xs text-gray-400">
          最近更新：{toDateOnly(record.updatedAt)}
          {record.sharedAt ? `；推送 GTM 时间：${toDateOnly(record.sharedAt)}` : ""}
        </p>
      )}
      <div>
        <Button type="primary" loading={saving} onClick={() => void submit()}>
          保存
        </Button>
      </div>
    </div>
  );
}
