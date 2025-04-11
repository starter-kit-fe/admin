import { Badge } from "@/components/ui/badge";

interface DefaultBadgeProps {
  isDefault: boolean | undefined;
}

export function DefaultBadge({ isDefault }: DefaultBadgeProps) {
  if (!isDefault) return null;

  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      默认
    </Badge>
  );
} 