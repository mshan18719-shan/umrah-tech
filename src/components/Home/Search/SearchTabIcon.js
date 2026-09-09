import styles from './search.module.css';

const TAB_ICON_CLASS = {
  'umrah-get-away': styles.tabIconUmrah,
  'hotel-tab-pane': styles.tabIconHotel,
  'flight-tab-pane': styles.tabIconFlight,
  'transfer-tab-pane': styles.tabIconTransfer,
  'activity-tab-pane': styles.tabIconActivity,
};

export default function SearchTabIcon({ tabId, mobile = false }) {
  const iconClass = TAB_ICON_CLASS[tabId];
  if (!iconClass) return null;

  return (
    <span
      className={`${styles.tabIcon} ${iconClass} ${mobile ? styles.tabIconMobile : ''}`}
      aria-hidden
    />
  );
}
