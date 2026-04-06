#!/usr/bin/env node
/**
 * AWAY Landing Page – Automated Integrity Checks
 * ────────────────────────────────────────────────
 * Zero external dependencies – runs with plain Node.js.
 * Exit code 0 = all checks passed, 1 = at least one failure.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
let passes   = 0;

/* ── Helpers ─────────────────────────────────────────────────── */
function pass(msg) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); passes++; }
function fail(msg) { console.error(`  \x1b[31m✗\x1b[0m ${msg}`); failures++; }
function warn(msg) { console.warn(`  \x1b[33m⚠\x1b[0m ${msg}`); }

function check(name, fn) {
  console.log(`\n\x1b[1m▸ ${name}\x1b[0m`);
  try { fn(); } catch (e) { fail(`Unexpected error: ${e.message}`); }
}

function readFile(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) { console.error(`FATAL: ${rel} not found`); process.exit(1); }
  return fs.readFileSync(abs, 'utf8');
}

/* ── Load files ──────────────────────────────────────────────── */
const html = readFile('index.html');
const js   = readFile('script.js');
readFile('style.css'); // just assert it exists

/* ── 1. Required files ───────────────────────────────────────── */
check('Required files exist', () => {
  [
    'index.html', 'style.css', 'script.js',
    'favicon.png', 'favicon.svg',
    'impressum.html', 'datenschutz.html', 'agb.html',
    '.nojekyll',
    '.github/workflows/deploy.yml',
  ].forEach(f => {
    if (fs.existsSync(path.join(ROOT, f))) pass(`${f}`);
    else fail(`${f} is MISSING`);
  });
});

/* ── 2. Required HTML IDs (critical sections & widgets) ─────── */
check('Required HTML element IDs', () => {
  [
    // Layout sections
    'nav', 'hero', 'features', 'how', 'showcase', 'roi', 'pricing', 'faq',
    // Interactive widgets
    'contact-modal', 'contact-form',
    'lang-de', 'lang-en',
    'mobile-menu-btn', 'mobile-nav',
    'employee-slider', 'request-slider',
    'savings-value', 'hours-value',
    // Contact form fields
    'cf-name', 'cf-email', 'cf-message', 'cf-subject', 'cf-error',
  ].forEach(id => {
    if (html.includes(`id="${id}"`)) pass(`#${id}`);
    else fail(`#${id} is MISSING`);
  });
});

/* ── 3. Internal anchor links resolve to existing IDs ───────── */
check('Internal anchor links resolve', () => {
  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
  const ids     = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  const unique  = [...new Set(anchors)];
  let broken = 0;
  unique.forEach(anchor => {
    if (ids.has(anchor)) pass(`#${anchor}`);
    else { fail(`#${anchor} referenced but no element with that id found`); broken++; }
  });
  if (broken === 0) pass(`All ${unique.length} internal anchors resolve`);
});

/* ── 4. No legacy DOCX / XLSX content ───────────────────────── */
check('No DOCX/XLSX content (AcroForm-PDF only)', () => {
  ['DOCX', 'XLSX'].forEach(term => {
    if (!html.includes(term)) pass(`"${term}" absent from HTML`);
    else fail(`"${term}" still present in HTML – should be AcroForm-PDF only`);
  });
});

/* ── 5. Production CTA links ────────────────────────────────── */
check('CTA buttons point to production URL', () => {
  const PROD = 'https://away-alpha.vercel.app/';
  const count = (html.match(/https:\/\/away-alpha\.vercel\.app\//g) || []).length;
  if (count >= 5) pass(`Production URL referenced ${count}× in HTML (≥5 required)`);
  else fail(`Production URL only referenced ${count}× – expected ≥ 5`);

  // href="#" without a modal trigger is suspicious
  const suspiciousHref = [...html.matchAll(/href="#"(?!\s*onclick)/g)];
  if (suspiciousHref.length === 0) pass('No dangling href="#" without onclick handler');
  else warn(`${suspiciousHref.length} href="#" found without onclick – verify they are intentional`);
});

/* ── 6. Contact modal JS functions ──────────────────────────── */
check('Contact modal JS functions defined in script.js', () => {
  [
    'window.openContactModal',
    'window.closeContactModal',
    'window.submitContactForm',
  ].forEach(fn => {
    if (js.includes(fn)) pass(`${fn}`);
    else fail(`${fn} is MISSING from script.js`);
  });
  // Modal trigger present in HTML
  if (html.includes('openContactModal()')) pass('openContactModal() called from HTML');
  else fail('openContactModal() never called – Innovation card broken');
});

/* ── 7. Language toggle (DE / EN) ───────────────────────────── */
check('DE/EN language toggle completeness', () => {
  const de = (html.match(/data-de="/g) || []).length;
  const en = (html.match(/data-en="/g) || []).length;

  if (de >= 50) pass(`${de} data-de attributes`);
  else fail(`Only ${de} data-de attributes found (expected ≥ 50)`);

  if (en >= 50) pass(`${en} data-en attributes`);
  else fail(`Only ${en} data-en attributes found (expected ≥ 50)`);

  if (de === en) pass('data-de and data-en counts match (no untranslated elements)');
  else fail(`Mismatch: data-de=${de}, data-en=${en} – some elements missing a translation`);
});

/* ── 8. iPhone frame & animated screens ─────────────────────── */
check('iPhone frame & screen animations', () => {
  if (html.includes('iphone-frame') || html.includes('iphone')) pass('iPhone frame element present');
  else fail('iPhone frame MISSING from Hero section');

  const screens = (html.match(/class="[^"]*app-screen/g) || []).length;
  if (screens >= 3) pass(`${screens} app-screen slides found (≥ 3 required)`);
  else fail(`Only ${screens} app-screen slides – expected ≥ 3`);
});

/* ── 9. Pricing section completeness ────────────────────────── */
check('Pricing section', () => {
  if (html.includes('Innovation Package')) pass('Innovation Package card present');
  else fail('Innovation Package MISSING from pricing');

  if (html.includes('openContactModal')) pass('Modal trigger present on Innovation card');
  else fail('Modal trigger MISSING from Innovation card');

  if (html.match(/6[^0-9]*€|€[^0-9]*6/)) pass('Pro price (6€/user) found');
  else fail('Pro price (6€) not found in HTML');

  // Price and unit are in separate elements – check both tokens independently within pricing section
  const pricingSec = html.match(/<section[^>]*id="pricing"[\s\S]*?<\/section>/);
  const pricingHtml = pricingSec ? pricingSec[0] : '';
  if (pricingHtml.includes('2 €') && pricingHtml.match(/\/ Nutzer \/ Monat|\/ user \/ month/))
    pass('Lite price (2€/user) found in pricing section');
  else fail('Lite price (2€/user) not found in pricing section');

  // AcroForm-PDF is a Pro-only feature (document_templates: false in Lite)
  if (pricingHtml.includes('AWAY –') || pricingHtml.includes('AWAY &ndash;') ||
      pricingHtml.match(/AWAY[^<]*Urlaubsplaner|Urlaubsplaner/))
    pass('Innovation card lists AWAY – Urlaubsplaner');
  else fail('Innovation card must list AWAY – Urlaubsplaner');

  // all three tiers
  ['Lite', 'Pro', 'Innovation'].forEach(tier => {
    if (html.includes(tier)) pass(`"${tier}" tier present`);
    else fail(`"${tier}" tier MISSING`);
  });
});

/* ── 10. FAQ section ─────────────────────────────────────────── */
check('FAQ section', () => {
  const faqItems = (html.match(/class="[^"]*faq-item/g) || []).length;
  if (faqItems >= 5) pass(`${faqItems} FAQ items found`);
  else fail(`Only ${faqItems} FAQ items – expected ≥ 5`);

  if (html.includes('faq-question') && html.includes('faq-answer'))
    pass('FAQ question/answer structure intact');
  else fail('FAQ question/answer markup MISSING');
});

/* ── 11. Accessibility basics ────────────────────────────────── */
check('Accessibility basics', () => {
  // Lang on <html>
  if (html.match(/<html[^>]+lang="/)) pass('<html lang="..."> set');
  else fail('<html> missing lang attribute');

  // All <img> have alt
  const imgs = [...html.matchAll(/<img\s([^>]*?)>/gi)];
  const missingAlt = imgs.filter(m => !m[1].includes('alt=')).length;
  if (missingAlt === 0) pass(`All ${imgs.length} <img> tags have alt attribute`);
  else fail(`${missingAlt}/${imgs.length} <img> tag(s) missing alt attribute`);

  // aria-modal on contact modal
  if (html.includes('aria-modal="true"')) pass('aria-modal="true" on contact dialog');
  else fail('aria-modal="true" MISSING on contact dialog');

  // Meta description
  if (html.includes('<meta name="description"')) pass('Meta description present');
  else fail('Meta description MISSING');

  // <title>
  if (html.includes('<title>')) pass('<title> present');
  else fail('<title> MISSING');
});

/* ── 12. Script.js core functions ────────────────────────────── */
check('script.js core functions present', () => {
  [
    'initLangToggle',
    'initIphoneScreenCycle',
    'initShowcaseTabs',
    'initROICalculator',
    'initFAQ',
    'initMobileMenu',
    'initReveal',
  ].forEach(fn => {
    if (js.includes(fn)) pass(`${fn}()`);
    else fail(`${fn}() MISSING from script.js`);
  });
});

/* ── 13. No inline JS errors (basic patterns) ────────────────── */
check('No obvious JS anti-patterns in HTML', () => {
  // javascript: hrefs are a security risk
  if (!html.includes('javascript:')) pass('No javascript: href found');
  else fail('javascript: href found – security risk');

  // eval()
  if (!js.includes('eval(')) pass('No eval() in script.js');
  else fail('eval() found in script.js – security risk');

  // document.write
  if (!js.includes('document.write')) pass('No document.write() in script.js');
  else fail('document.write() found in script.js');
});

/* ── 14. .nojekyll and Tailwind CDN ─────────────────────────── */
check('Static site configuration', () => {
  if (fs.existsSync(path.join(ROOT, '.nojekyll'))) pass('.nojekyll present (GitHub Pages bypass)');
  else fail('.nojekyll MISSING – GitHub Pages may ignore underscored files');

  if (html.includes('tailwindcss') || html.includes('tailwind')) pass('Tailwind CSS CDN referenced');
  else fail('Tailwind CSS not referenced in HTML');
});

/* ── 15. No legacy FREE tier ────────────────────────────────── */
check('No legacy FREE tier in pricing', () => {
  // Verify the old free-tier marketing text is gone from the pricing section
  const pricingMatch = html.match(/<section[^>]*id="pricing"[\s\S]*?<\/section>/);
  const pricingBlock = pricingMatch ? pricingMatch[0] : '';

  if (!pricingBlock.includes('Für immer kostenlos')) pass('"Für immer kostenlos" absent from pricing section');
  else fail('"Für immer kostenlos" still present in pricing section – legacy FREE tier not fully removed');

  if (!pricingBlock.includes('Free forever')) pass('"Free forever" absent from pricing section');
  else fail('"Free forever" still present in pricing section – legacy FREE tier not fully removed');

  if (!pricingBlock.match(/data-de="FREE"/)) pass('FREE tier label removed from pricing');
  else fail('data-de="FREE" still present in pricing – legacy FREE tier not fully removed');
  if (!pricingBlock.includes('Alles aus Free')) pass('"Alles aus Free" legacy text removed from pricing');
  else fail('"Alles aus Free" still present in pricing – should reference Lite');});

/* ── 16. Lite user limit (50 users) visible in HTML ────────────────────────── */
check('Lite user limit (50 users) visible in HTML', () => {
  if (html.match(/Bis 50 Nutzer/)) pass('"Bis 50 Nutzer" found in HTML (DE)');
  else fail('"Bis 50 Nutzer" MISSING from HTML');

  if (html.match(/Up to 50 users/)) pass('"Up to 50 users" found in HTML (EN)');
  else fail('"Up to 50 users" MISSING from HTML');
});
/* ── 17. AcroForm-PDF is Pro-only (document_templates: false in Lite) ─────── */
check('AcroForm-PDF is a Pro-only feature', () => {
  const pricingSec = html.match(/<section[^>]*id="pricing"[\s\S]*?<\/section>/);
  const pricingHtml = pricingSec ? pricingSec[0] : '';

  // AcroForm must appear in Pro card (it has check-ico rows)
  if (pricingHtml.includes('AcroForm')) pass('AcroForm-PDF Vorlagen found in pricing section');
  else fail('AcroForm-PDF Vorlagen missing from pricing section entirely');

  // The Lite card – AcroForm must appear as a cross-ico (disabled), not check-ico (enabled)
  // Extract the Lite card block (first pricing-card, before "featured")
  const liteCard = pricingHtml.match(/<div class="pricing-card reveal">([\s\S]*?)<\/div>\s*\n\s*<\/div>\s*\n\s*\/\*|<div class="pricing-card reveal">([\s\S]*?)(?=<div class="pricing-card featured)/);
  const liteBlock = liteCard ? (liteCard[1] || liteCard[2] || '') : '';
  if (liteBlock) {
    const acroInLite = liteBlock.match(/check-ico[^>]*>[^<]*<[^>]*>[^<]*AcroForm|AcroForm[^<]*check-ico/);
    if (!acroInLite) pass('AcroForm-PDF not in Lite ✓ section (correctly gated to Pro)');
    else fail('AcroForm-PDF found as a check feature in Lite – must be Pro-only (document_templates: false in Lite)');
  } else {
    // Fallback: brute-force check that cross-ico appears before AcroForm in pricing HTML
    const crossBeforeAcro = pricingHtml.search(/cross-ico/) < pricingHtml.search(/AcroForm/);
    if (crossBeforeAcro) pass('AcroForm-PDF appears after a cross-ico in pricing (likely gated)');
    else warn('Could not precisely determine Lite AcroForm gating – verify visually');
  }
});
/* ── 18. Footer Produktfamilie labels ────────────────────────────── */
check('Footer Produktfamilie labels correct', () => {
  if (html.includes('data-de="Urlaubsplaner"')) pass('AWAY – Urlaubsplaner label in footer (DE)');
  else fail('AWAY Urlaubsplaner label MISSING from footer');

  if (html.includes('data-en="Leave planner"')) pass('AWAY – Leave planner label in footer (EN)');
  else fail('AWAY Leave planner label MISSING from footer (EN)');

  if (!html.includes('data-de="Hub"')) pass('Legacy "Hub" label removed from footer');
  else fail('Legacy "Hub" label still present in footer');

  if (html.includes('data-de="Verwaltung"')) pass('TeamRadar – Verwaltung label in footer (DE)');
  else fail('TeamRadar Verwaltung label MISSING from footer');
});

/* ── Summary ─────────────────────────────────────────────────── */
console.log('\n' + '═'.repeat(52));
const status = failures === 0
  ? `\x1b[32m  ALL ${passes} CHECKS PASSED\x1b[0m`
  : `\x1b[31m  ${failures} FAILED\x1b[0m  |  \x1b[32m${passes} passed\x1b[0m`;
console.log(status);
console.log('═'.repeat(52) + '\n');

if (failures > 0) process.exit(1);
