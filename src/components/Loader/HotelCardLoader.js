import React from 'react'

const SkeletonCard = () => (
    <div className="col-12 mb-3 px-0">
        <article className="htc-card placeholder-glow">
            <div className="htc-card__layout">
                <div className="htc-card__media bg-light">
                    <span className="placeholder col-12 h-100 rounded-0 d-block" style={{ minHeight: 240 }}></span>
                </div>
                <div className="htc-card__content">
                    <div className="htc-card__meta mb-2">
                        <span className="placeholder rounded col-3"></span>
                        <span className="placeholder rounded col-4"></span>
                    </div>
                    <h3 className="htc-card__title">
                        <span className="placeholder rounded col-9"></span>
                    </h3>
                    <p className="htc-card__location">
                        <span className="placeholder rounded col-7"></span>
                    </p>
                    <ul className="htc-card__amenities">
                        <li className="placeholder rounded col-2"></li>
                        <li className="placeholder rounded col-3"></li>
                        <li className="placeholder rounded col-2"></li>
                    </ul>
                    <div className="htc-card__footer">
                        <div className="htc-card__pricing">
                            <span className="placeholder rounded col-5"></span>
                        </div>
                        <span className="placeholder rounded htc-card__cta" style={{ height: 42, width: 130 }}></span>
                    </div>
                </div>
            </div>
        </article>
    </div>
);

export default function HotelCardLoader() {
    return (
        <div className="container hotel-card">
            <div className="row">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}
