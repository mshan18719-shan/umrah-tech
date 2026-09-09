import React, { Suspense } from "react";
import Main from "@/components/Activities/Listing/Main";
function Activities() {

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Main/>
      </Suspense>
    </>
  );
}

export default Activities;
