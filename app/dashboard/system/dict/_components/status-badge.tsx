import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: number | undefined;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === undefined) return null;

  return status === 1 ? (
    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
      正常
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
      停用
    </Badge>
  );
} 