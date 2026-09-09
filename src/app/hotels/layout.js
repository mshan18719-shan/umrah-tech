import QueryProviders from "@/util/QueryProviders";
import { Suspense } from "react";
import loading from "@/components/Loader/loading";
export default function RootLayout({ children }) {
    return (
        <div>
                <QueryProviders>
                    <Suspense fallback={<loading/>}>
                    {children}
                    </Suspense>
                </QueryProviders>
        </div>
    );
}
