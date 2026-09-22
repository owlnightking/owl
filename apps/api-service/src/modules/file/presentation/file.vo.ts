import { ApiProperty } from "@nestjs/swagger";
import { PageMetaVo } from "../../../common/response/page.vo";

export class FileVo {
  @ApiProperty({ description: "文件 id", example: 1 })
  id!: number;

  @ApiProperty({ description: "文件名", example: "avatar.png" })
  name!: string;

  @ApiProperty({ description: "文件 MIME 类型", example: "image/png" })
  mimeType!: string;

  @ApiProperty({ description: "文件大小（字节）", example: 10240 })
  size!: number;

  @ApiProperty({ description: "存储桶名称", example: "owl-files" })
  bucket!: string;

  @ApiProperty({ description: "对象存储 key", example: "images/2026/09/avatar.png" })
  objectKey!: string;

  @ApiProperty({ description: "访问地址", nullable: true, example: "https://minio.example.com/owl-files/avatar.png" })
  url!: string | null;

  @ApiProperty({ description: "上传人 id", example: 1 })
  uploadedBy!: number;

  @ApiProperty({ description: "创建时间", example: "2026-09-20T10:00:00.000Z" })
  createdAt!: string;
}

export class FilePageVo extends PageMetaVo {
  @ApiProperty({ description: "文件列表", type: [FileVo] })
  list!: FileVo[];
}
