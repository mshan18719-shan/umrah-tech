import React from 'react';

export default function HotelInvoiceLoader() {
  return (
    <div className="doc-skel" aria-hidden="true">
      <span className="doc-skel__bar doc-skel__bar--header" />

      <div className="doc-skel__row">
        <span className="doc-skel__bar doc-skel__bar--half" />
        <span className="doc-skel__bar doc-skel__bar--half" />
      </div>

      <span className="doc-skel__bar doc-skel__bar--block" />

      <div className="doc-skel__table">
        <span className="doc-skel__bar doc-skel__bar--accent" />
        <span className="doc-skel__bar doc-skel__bar--row" />
        <span className="doc-skel__bar doc-skel__bar--row" />
        <span className="doc-skel__bar doc-skel__bar--row" />
      </div>

      <span className="doc-skel__bar doc-skel__bar--block" />
      <span className="doc-skel__bar doc-skel__bar--footer" />
    </div>
  );
}
