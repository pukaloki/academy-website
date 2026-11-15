// PLACEHOLDER manifest: see placeholders.md. Never put credentials here.
export const site = {
  name: 'The Shortcut Academy',
  email: 'info@theshortcutacademy.in',
  address: 'Hyderabad, Telangana, India',
  communityUrl: '',
  social: { instagram: 'https://www.instagram.com/the_shortcut.in/' },
};

// All examples are intentionally bracketed and cannot accept payment.
// To open a batch: replace every display placeholder, set published=true,
// amountPaise, capacity, startsAt (ISO 8601), and its private WhatsApp URL.
export const batches = [
  { id: 'live-editing', name: 'The Complete Editing Program', type: 'weekday', code: 'ONE PROGRAM · EVERY SKILL', days: 'Monday to Friday', time: '8:30 PM to 10:00 PM', timezone: 'Asia/Kolkata (IST)', start: 'Batch start date will be announced', duration: '10 weeks', price: '₹2,999', seats: 'Limited to 30 students per batch', published: true, amountPaise: 299900, capacity: 30, startsAt: null, advanceEnrollment: true, whatsappUrl: '' },
];

export const modules = [
 { title: 'The craft of the edit.', subtitle: 'Editing & motion', icon: 'cut', tools: 'PREMIERE PRO · AFTER EFFECTS', items: ['Organize footage and build a purposeful rough cut', 'Refine pacing, dialogue, and sound design', 'Balance color in Premiere Pro', 'Animate type and graphics in After Effects'], outcome: 'Take a sequence from rough cut to polished export, with a reason behind every decision.' },
 { title: 'A story worth watching.', subtitle: 'Story & structure', icon: 'frame', tools: 'PLANNING · SCRIPTING · STORYTELLING', items: ['Plan a clear hook, structure, and payoff', 'Choose shots that move the story forward', 'Edit for different formats and audiences', 'Make sound and picture work together'], outcome: 'Shape attention through shot selection, rhythm, and a clear point of view.' },
 { title: 'Make the work work.', subtitle: 'Freelance practice', icon: 'briefcase', tools: 'OUTREACH · PRICING · CLIENT OPERATIONS', items: ['Write focused outreach and client proposals', 'Negotiate fees, scope, and revision rounds', 'Onboard clients and agree a delivery schedule', 'Present your edit and handle feedback'], outcome: 'Build a practical client process, from the first conversation to the final handoff.' },
 { title: 'Refine. Present. Repeat.', subtitle: 'Portfolio & feedback', icon: 'chat', tools: 'REVIEW · PORTFOLIO · COMMUNITY', items: ['Discuss creative decisions in live reviews', 'Revise your edit using specific feedback', 'Select and explain work for your portfolio', 'Prepare for freelance and editing opportunities'], outcome: 'Develop work you can explain, improve, and confidently put in front of a client.' },
];

export const faqs = [
 ['Can I join as a complete beginner?', 'Yes. Start from scratch and progress to advanced editing across 10 weeks. Learn the tools step by step, then apply them to storytelling, motion graphics, sound, colour, and client work.'],
 ['Are all classes live and interactive?', 'Yes. Classes run Monday to Friday, 8:30 PM to 10:00 PM IST. Learn with professional editors, ask questions during the session, and get feedback on your work.'],
 ['How do weekly assignments work?', 'Saturday and Sunday are for practising and completing your assignment. Submit it the following Monday before moving on to the next topic or concept.'],
 ['Which software will I learn?', 'Adobe Premiere Pro, Adobe After Effects, and DaVinci Resolve. Bring a compatible computer, reliable internet connection, and headphones.'],
 ['What is included in ₹2,999?', 'The complete 10-week program includes live interactive classes, practical assignments, editing community access, free creative assets, and placement support. Each batch is limited to 30 students.'],
 ['How do I access the classes after payment?', 'After your payment is verified, your student dashboard reveals the batch WhatsApp and editing community links. Google Meet links and class updates will be shared in the batch group.'],
 ['What does placement support include?', 'Portfolio guidance, interview preparation, and help exploring editing and freelance opportunities. A job, client, or specific income is not guaranteed.'],
 ['How do I enroll?', 'Choose Enroll now, continue with Google, and add your phone number. Review your details and pay securely through Razorpay to enroll. Your place is confirmed only after payment verification.'],
 ['Who can I contact about classes or refunds?', 'Email info@theshortcutacademy.in for course questions, missed-class support, or refund requests. Course fees are non-refundable, except where required by applicable law.'],
];

export const shortFormVideos = [
  { id: 'short-01', num: '01', title: 'Placement Report', caption: '2026 PLACEMENT REPORT', category: 'Career & Industry', src: '/videos/short-form/01-placement-report.mp4', poster: '/videos/posters/short-01.webp', aspect: '9:16', duration: '1:21' },
  { id: 'short-02', num: '02', title: 'E-Commerce Hook', caption: 'DROPSHIPPING AD EDIT', category: 'Commercial & Ads', src: '/videos/short-form/02-dropshipping.mp4', poster: '/videos/posters/short-02.webp', aspect: '9:16', duration: '1:24' },
  { id: 'short-03', num: '03', title: 'SFX & Sound Design', caption: 'SOUND DESIGN WITH SFX', category: 'Audio & Foley', src: '/videos/short-form/03-final-with-sfx.mp4', poster: '/videos/posters/short-03.webp', aspect: '9:16', duration: '0:18' },
  { id: 'short-04', num: '04', title: 'Dynamic Social Reel', caption: 'HIGH RETENTION REEL', category: 'Social Media', src: '/videos/short-form/04-dynamic-reel.mp4', poster: '/videos/posters/short-04.webp', aspect: '9:16', duration: '0:44' },
  { id: 'short-05', num: '05', title: 'Apify Motion Graphics', caption: 'BEFORE & AFTER VFX', category: 'Visual Effects', src: '/videos/short-form/05-apify-before-after.mp4', poster: '/videos/posters/short-05.webp', aspect: '9:16', duration: '0:45' },
  { id: 'short-06', num: '06', title: 'Apify Color & Grade', caption: 'COLOR TREATMENT PASS', category: 'Color Grading', src: '/videos/short-form/06-apify-grading.mp4', poster: '/videos/posters/short-06.webp', aspect: '9:16', duration: '0:32' },
  { id: 'short-07', num: '07', title: 'Brand Narrative Cut', caption: 'CLIENT SOCIAL EDIT 02', category: 'Brand Story', src: '/videos/short-form/07-social-cut-02.mp4', poster: '/videos/posters/short-07.webp', aspect: '9:16', duration: '1:03' },
  { id: 'short-08', num: '08', title: 'Rhythm & Pacing Edit', caption: 'PACING & RHYTHM 07', category: 'Editing Craft', src: '/videos/short-form/08-social-cut-07.mp4', poster: '/videos/posters/short-08.webp', aspect: '9:16', duration: '0:45' },
  { id: 'short-09', num: '09', title: 'Every Generation Story', caption: 'STORYTELLING CUT', category: 'Micro Narrative', src: '/videos/short-form/09-every-generation.mp4', poster: '/videos/posters/short-09.webp', aspect: '9:16', duration: '0:09' },
  { id: 'short-10', num: '10', title: 'Digital Marketing Sample', caption: 'PERFORMANCE MARKETING', category: 'Marketing Edit', src: '/videos/short-form/10-digital-marketing.mp4', poster: '/videos/posters/short-10.webp', aspect: '9:16', duration: '0:23' },
  { id: 'short-11', num: '11', title: 'Final Master Sequence', caption: 'POLISHED CLIENT MASTER', category: 'Final Delivery', src: '/videos/short-form/11-final-master.mp4', poster: '/videos/posters/short-11.webp', aspect: '9:16', duration: '0:24' },
];

export const longFormVideos = [
  { id: 'long-01', num: '01', title: 'Buzzspear Media Trailer 1', caption: 'BUZZSPEAR TRAILER 01', category: 'Commercial Film', src: '/videos/long-form/01-buzzspear-trailer-1.mp4', poster: '/videos/posters/long-01.webp', aspect: '16:9', duration: '1:18' },
  { id: 'long-02', num: '02', title: 'Buzzspear Media Trailer 3', caption: 'BUZZSPEAR TRAILER 03', category: 'Agency Showcase', src: '/videos/long-form/02-buzzspear-trailer-3.mp4', poster: '/videos/posters/long-02.webp', aspect: '16:9', duration: '0:57' },
  { id: 'long-03', num: '03', title: 'Architectural 3D Render', caption: '3D BUILDINGS RENDER', category: '3D & Motion', src: '/videos/long-form/03-hod-buildings-render.mp4', poster: '/videos/posters/long-03.webp', aspect: '16:9', duration: '0:53' },
  { id: 'long-04', num: '04', title: 'Cinematic Teaser', caption: 'NARRATIVE TEASER', category: 'Cinematic Narrative', src: '/videos/long-form/04-cinematic-teaser.mp4', poster: '/videos/posters/long-04.webp', aspect: '16:9', duration: '1:52' },
  { id: 'long-05', num: '05', title: "Director's Cut 4K Teaser", caption: "DIRECTOR'S 4K CUT", category: 'Cinematic Production', src: '/videos/long-form/05-teaser-cut-4k.mp4', poster: '/videos/posters/long-05.webp', aspect: '16:9', duration: '2:41' },
];

export const carouselPanels = [
  { ...shortFormVideos[0], ringNum: '01', panelType: 'panel-tall' },
  { ...shortFormVideos[1], ringNum: '02', panelType: 'panel-tall' },
  { ...longFormVideos[0], ringNum: '03', panelType: 'panel-wide' },
  { ...shortFormVideos[2], ringNum: '04', panelType: 'panel-tall' },
  { ...shortFormVideos[3], ringNum: '05', panelType: 'panel-tall' },
  { ...longFormVideos[1], ringNum: '06', panelType: 'panel-wide' },
  { ...shortFormVideos[4], ringNum: '07', panelType: 'panel-tall' },
  { ...shortFormVideos[5], ringNum: '08', panelType: 'panel-tall' },
  { ...longFormVideos[2], ringNum: '09', panelType: 'panel-wide' },
  { ...shortFormVideos[6], ringNum: '10', panelType: 'panel-tall' },
  { ...shortFormVideos[7], ringNum: '11', panelType: 'panel-tall' },
  { ...longFormVideos[3], ringNum: '12', panelType: 'panel-wide' },
  { ...shortFormVideos[8], ringNum: '13', panelType: 'panel-tall' },
  { ...shortFormVideos[9], ringNum: '14', panelType: 'panel-tall' },
  { ...longFormVideos[4], ringNum: '15', panelType: 'panel-wide' },
  { ...shortFormVideos[10], ringNum: '16', panelType: 'panel-tall' },
];
