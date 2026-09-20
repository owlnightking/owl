import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Modal, Notification, Slider, Upload } from "@arco-design/web-react";
import { IconMinus, IconPlus, IconRotateLeft } from "@arco-design/web-react/icon";
import type { RequestOptions, UploadItem } from "@arco-design/web-react/es/Upload";
import ReactCrop, { centerCrop, cropToCanvas, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { upload } from "../api/client";
import { getQiankunPopupContainer } from "../utils/qiankun";

const DEFAULT_ASPECT = 1;
const DEFAULT_ACCEPT = "image/*";
const DEFAULT_UPLOAD_PATH = "/files/upload";
const SINGLE_FILE_LIMIT = 1;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1;
const ROTATION_STEP = 90;
const MIN_CROP_SIZE = 40;
const INITIAL_CROP_PERCENT = 90;

export interface ImageUploadProps {
  value?: string;
  onChange?: (url: string | undefined) => void;
  aspect?: number;
  accept?: string;
  disabled?: boolean;
  tip?: string;
  uploadPath?: string;
}

function centerAspectCrop(width: number, height: number, aspect: number): Crop {
  return centerCrop(makeAspectCrop({ unit: "%", width: INITIAL_CROP_PERCENT }, aspect, width, height), width, height);
}

function toFileList(url: string | undefined): UploadItem[] {
  return url ? [{ uid: "current", name: "image", status: "done", url }] : [];
}

export function ImageUpload({
  value,
  onChange,
  aspect = DEFAULT_ASPECT,
  accept = DEFAULT_ACCEPT,
  disabled,
  tip,
  uploadPath = DEFAULT_UPLOAD_PATH,
}: ImageUploadProps) {
  const [fileList, setFileList] = useState<UploadItem[]>(() => toFileList(value));
  const [cropSource, setCropSource] = useState<{ file: File; url: string } | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(ZOOM_DEFAULT);
  const [rotate, setRotate] = useState(0);
  const resolveCropRef = useRef<((result: File | false) => void) | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setFileList(toFileList(value));
  }, [value]);

  useEffect(() => {
    if (!imageRef.current) {
      return;
    }
    // react-image-crop 的裁剪坐标基于图片未缩放的布局盒计算，
    // 这里用 transform 缩放/旋转图片，导出时再把同样的 scale/rotate 传给 cropToCanvas 还原。
    imageRef.current.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
  }, [scale, rotate]);

  const openCropper = (file: File) =>
    new Promise<File | false>((resolve) => {
      resolveCropRef.current = resolve;
      setCrop(undefined);
      setCompletedCrop(undefined);
      setScale(ZOOM_DEFAULT);
      setRotate(0);
      setCropSource({ file, url: URL.createObjectURL(file) });
    });

  const finishCrop = (result: File | false) => {
    resolveCropRef.current?.(result);
    resolveCropRef.current = null;
    setCropSource((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.url);
      }
      return null;
    });
  };

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = event.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleConfirmCrop = async () => {
    const image = imageRef.current;
    if (!cropSource || !completedCrop?.width || !completedCrop.height || !image) {
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      await cropToCanvas(image, canvas, completedCrop, scale, rotate);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve));
      if (!blob) {
        throw new Error("图片裁剪失败");
      }
      finishCrop(new File([blob], cropSource.file.name || "image", { type: cropSource.file.type || "image/png" }));
    } catch (error) {
      Notification.error({ content: error instanceof Error ? error.message : "图片裁剪失败" });
      finishCrop(false);
    }
  };

  const handleRequest = (options: RequestOptions) => {
    const formData = new FormData();
    formData.append("file", options.file);
    upload<{ url: string }>(uploadPath, formData)
      .then((res) => {
        options.onSuccess({ url: res.url });
      })
      .catch((error: unknown) => {
        options.onError(error instanceof Error ? error : new Error("upload failed"));
        Notification.error({ content: error instanceof Error ? error.message : "图片上传失败" });
      });
  };

  const handleFileListChange = (list: UploadItem[]) => {
    const next = list.slice(-1);
    setFileList(next);
    const latest = next[0];
    if (latest?.status === "done") {
      const response = latest.response as { url?: string } | undefined;
      onChange?.(response?.url ?? latest.url);
    } else if (!latest) {
      onChange?.(undefined);
    }
  };

  return (
    <>
      <Upload
        listType="picture-card"
        imagePreview
        accept={accept}
        limit={SINGLE_FILE_LIMIT}
        fileList={fileList}
        disabled={disabled}
        tip={tip}
        beforeUpload={(file) => openCropper(file)}
        customRequest={handleRequest}
        onChange={handleFileListChange}
      />
      <Modal
        title="裁剪图片"
        visible={!!cropSource}
        onOk={handleConfirmCrop}
        onCancel={() => finishCrop(false)}
        okButtonProps={{ disabled: !completedCrop?.width }}
        getPopupContainer={getQiankunPopupContainer}
        unmountOnExit
        autoFocus={false}
      >
        {cropSource && (
          <div>
            <div className="flex justify-center">
              <ReactCrop
                className="max-h-72"
                crop={crop}
                aspect={aspect}
                minWidth={MIN_CROP_SIZE}
                minHeight={MIN_CROP_SIZE}
                ruleOfThirds
                onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
              >
                <img ref={imageRef} alt="裁剪图片" src={cropSource.url} onLoad={handleImageLoad} />
              </ReactCrop>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <IconMinus
                className="cursor-pointer"
                onClick={() => setScale((current) => Math.max(ZOOM_MIN, Number((current - ZOOM_STEP).toFixed(1))))}
              />
              <Slider
                className="flex-1"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={ZOOM_STEP}
                value={scale}
                onChange={(current) => setScale(Array.isArray(current) ? current[0] : current)}
              />
              <IconPlus
                className="cursor-pointer"
                onClick={() => setScale((current) => Math.min(ZOOM_MAX, Number((current + ZOOM_STEP).toFixed(1))))}
              />
              <IconRotateLeft
                className="cursor-pointer"
                onClick={() => setRotate((current) => current - ROTATION_STEP)}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
