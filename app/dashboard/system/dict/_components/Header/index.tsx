import { StatusFilter } from "@/app/dashboard/_components/filters/status";
import { useStore } from "@/app/dashboard/system/dict/store";
import AddBtn from "./add-btn";
import ExportBtn from "./export-btn";
export default function Header() {
    const { lookupParams, setLookupParams } = useStore();
    const handleStatusChange = (status: string) => {
        setLookupParams({ status });
    };

    return (
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
                <AddBtn />
                <ExportBtn />
            </div>
            <StatusFilter
                status={lookupParams.status}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}