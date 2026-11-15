import { site, batches } from '../config/content.mjs';

// Facts only: no invented reviews, dates, instructors, or employment promises.
export function structuredData(path, origin) {
  if (path !== '/' || !/^https:\/\/[^/]+$/.test(origin || '')) return '';
  const url = `${origin}/`, provider = `${url}#organization`, batch = batches[0];
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${url}#website`, url, name: site.name,
        alternateName: ['Shortcut Academy', 'The Short Cut Academy', 'Short Cut Academy'],
        publisher: { '@id': provider }, inLanguage: 'en-IN' },
      { '@type': 'EducationalOrganization', '@id': provider, name: site.name, url,
        logo: `${origin}/assets/shortcut-logo.jpg`, email: site.email,
        sameAs: Object.values(site.social).filter(Boolean) },
      { '@type': 'Course', '@id': `${url}#course`, url: `${url}#curriculum`, name: batch.name,
        description: 'Beginner-to-advanced live video editing classes in Premiere Pro, After Effects and DaVinci Resolve, with storytelling, freelance practice and placement support.',
        provider: { '@id': provider }, inLanguage: 'en', timeRequired: 'P10W',
        educationalLevel: 'Beginner to advanced', coursePrerequisites: 'A compatible computer and reliable internet connection.',
        teaches: ['Video editing', 'Adobe Premiere Pro', 'Adobe After Effects', 'DaVinci Resolve', 'Storytelling', 'Freelance client workflows'],
        offers: { '@type': 'Offer', price: batch.amountPaise / 100, priceCurrency: 'INR', url: `${url}#batches`, category: 'Paid' },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT7H30M',
          courseSchedule: { '@type': 'Schedule', repeatFrequency: 'P1W', repeatCount: 10,
            byDay: ['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day=>`https://schema.org/${day}`),
            startTime: '20:30:00', endTime: '22:00:00', scheduleTimezone: 'Asia/Kolkata' } } }
    ]
  };
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}
