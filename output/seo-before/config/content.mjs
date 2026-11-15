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
