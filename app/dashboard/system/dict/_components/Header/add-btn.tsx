import { Button } from "@/components/ui/button";
import { useStore } from "@/app/dashboard/system/dict/store";
import { PlusCircle } from "lucide-react";

export default function Page() {
    const { toggleAddModal, selectedGroup } = useStore()
    return (
        <Button
            onClick={() => toggleAddModal(true)}
            className="cursor-pointer"
            disabled={!selectedGroup}
            size="sm"
        >
            <PlusCircle className="mr-2 h-4 w-4" />
            新增字典项
        </Button>
    );
}