// Keep account identifiers and query parameters out of page-view URLs.
window.dataLayer = window.dataLayer || [];
window.gtag = function () { window.dataLayer.push(arguments); };
window.gtag('js', new Date());
window.gtag('config', 'G-CNWP4MTLLX', {
  page_location: window.location.origin + window.location.pathname,
  page_referrer: document.referrer ? document.referrer.split(/[?#]/)[0] : '',
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});
