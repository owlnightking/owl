/** 本地回环 IP 地址集合，用于识别本机请求 */
export const LOCAL_IP_ADDRESSES = ["::1", "127.0.0.1", "localhost"] as const;

/** IPv四 映射的 IPv六 地址前缀 */
export const IPV4_MAPPED_PREFIX = "::ffff:" as const;
