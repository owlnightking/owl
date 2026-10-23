import { Avatar } from "@arco-design/mobile-react";

interface PersonNameProps {
  name: string | null | undefined;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export function PersonName({ name, avatarUrl, size = 24, className = "" }: PersonNameProps) {
  if (!name) return <span className="text-gray-400">-</span>;
  const avatarSize = size <= 18 ? "smaller" : size <= 24 ? "small" : size <= 32 ? "medium" : "large";
  return (
    <span className={`inline-flex min-w-0 items-center gap-1 align-middle ${className}`}>
      <Avatar size={avatarSize} className="flex-shrink-0">
        {avatarUrl ? <img src={avatarUrl} alt={name} /> : name.charAt(0)}
      </Avatar>
      <span className="truncate">{name}</span>
    </span>
  );
}
