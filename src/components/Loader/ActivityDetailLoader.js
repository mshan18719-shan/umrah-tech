import React from 'react';

export default function ActivityDetailLoader() {
  return (
    <div className="container pt-4" aria-hidden="true">
      <span className="activity-detail-skel activity-detail-skel--gallery" />

      <div className="row mt-3">
        <div className="col-md-8 col-12">
          <div className="activity-detail-skel-card">
            <span className="activity-detail-skel activity-detail-skel--badge" />
            <span className="activity-detail-skel activity-detail-skel--title" />
            <span className="activity-detail-skel activity-detail-skel--line" />
            <span className="activity-detail-skel activity-detail-skel--line-short" />
          </div>

          <div className="activity-detail-skel-card">
            <span className="activity-detail-skel activity-detail-skel--section" />
            <span className="activity-detail-skel activity-detail-skel--line" />
            <span className="activity-detail-skel activity-detail-skel--line" />
            <span className="activity-detail-skel activity-detail-skel--line-short" />
          </div>

          <div className="activity-detail-skel-card">
            <span className="activity-detail-skel activity-detail-skel--section" />
            <span className="activity-detail-skel activity-detail-skel--block" />
          </div>
        </div>

        <div className="col-md-4 col-12">
          <div className="activity-detail-skel-card">
            <span className="activity-detail-skel activity-detail-skel--section" />
            <span className="activity-detail-skel activity-detail-skel--sidebar" />
            <span className="activity-detail-skel activity-detail-skel--btn" />
          </div>
          <div className="activity-detail-skel-card">
            <span className="activity-detail-skel activity-detail-skel--line" />
            <span className="activity-detail-skel activity-detail-skel--line-short" />
          </div>
        </div>
      </div>
    </div>
  );
}
