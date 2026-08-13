# CD 部署配置说明

## 1. GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下 secrets：

### 阿里云镜像仓库凭证

- `ALIYUN_CR_USERNAME`: 阿里云容器镜像服务用户名
- `ALIYUN_CR_PASSWORD`: 阿里云容器镜像服务密码

### K3s 集群凭证

- `K3S_KUBECONFIG`: K3s 集群的 kubeconfig（base64 编码）

生成 KUBECONFIG secret：

```bash
cat ~/.kube/config | base64 | tr -d '\n'
```

## 2. 阿里云镜像仓库配置

### 创建命名空间

1. 登录阿里云容器镜像服务
2. 创建命名空间：`owl`
3. 创建镜像仓库（每个应用一个）：
   - `api-service`
   - `admin-web`
   - `owl-web`
   - `cron-web`
   - `cron-service`

### 镜像仓库地址

```
registry.cn-hangzhou.aliyuncs.com/owl/
```

## 3. 本地测试部署

### 测试 K8s 清单

```bash
# 本地验证
kubectl apply --dry-run=client -k k8s/base/

# 部署到 K3s
kubectl apply -k k8s/base/

# 查看状态
kubectl get pods -n owl
kubectl get services -n owl
```

### 构建并推送镜像

```bash
# 登录阿里云
docker login registry.cn-hangzhou.aliyuncs.com

# 构建并推送（以 api-service 为例）
docker build -t registry.cn-hangzhou.aliyuncs.com/owl/api-service:latest -f apps/api-service/Dockerfile .
docker push registry.cn-hangzhou.aliyuncs.com/owl/api-service:latest
```

## 4. 部署流程

1. 代码推送到 `main` 分支
2. GitHub Actions 自动触发
3. 构建 Docker 镜像并推送到阿里云
4. 更新 K3s 集群中的部署
5. 验证部署状态

## 5. 故障排查

### 查看 Pod 状态

```bash
kubectl get pods -n owl
kubectl describe pod <pod-name> -n owl
```

### 查看日志

```bash
kubectl logs <pod-name> -n owl
```

### 查看服务

```bash
kubectl get services -n owl
kubectl describe service <service-name> -n owl
```
