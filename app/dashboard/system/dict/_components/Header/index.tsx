import { StatusFilter } from "@/app/dashboard/_components/filters/status";
import { useStore } from "@/app/dashboard/system/dict/store";
import AddBtn from "./add-btn";
export default function Header() {
    const { lookupParams, setLookupParams } = useStore();
    const handleStatusChange = (status: string) => {
        setLookupParams({ status });
    };


    return (
        <div className="flex justify-between items-center">
            <AddBtn />
            <StatusFilter
                status={lookupParams.status || 'all'}
                onStatusChange={handleStatusChange}
            />
        </div>
    );
}