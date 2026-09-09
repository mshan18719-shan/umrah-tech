import QueryProviders from "@/util/QueryProviders";
import { Suspense } from "react";
import loading from "@/components/Loader/loading";

export default function HolidayPackageLayout({ children }) {
    return (
        <div>
            <QueryProviders>
                <Suspense fallback={<loading />}>
                    {children}
                </Suspense>
            </QueryProviders>
        </div>
    );
}
