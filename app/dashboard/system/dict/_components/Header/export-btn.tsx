import { useStore } from "@/app/dashboard/system/dict/store";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function Page() {
    const { selectedGroup } = useStore();
    const handleExport = () => {
        console.log('导出');
    };
    return (
        <Button
            variant="outline"
            onClick={handleExport}
            disabled={!selectedGroup}
            className="cursor-pointer"
            size="sm"
        >
            <FileDown className="mr-2 h-4 w-4" />
            导出
        </Button>
    );
}