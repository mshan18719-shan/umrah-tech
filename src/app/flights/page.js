
import FlightListingPage from "@/components/Flights/FlightListingPage";
import FlightListingFullLoader from "@/components/Loader/FlightListingFullLoader";
import { Suspense } from "react";
export default function page() {

    return (
        <div>
            <Suspense fallback={<FlightListingFullLoader />}>
                <FlightListingPage />
            </Suspense>
        </div>
    )
}
