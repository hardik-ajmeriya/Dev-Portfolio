/**
 * Build the site's JSON-LD from the same data the page renders from.
 *
 * Called by prerender.js at build time. Nothing here is hand-maintained
 * alongside the content it describes, which is the whole point.
 *
 * WHY THIS EXISTS
 * ---------------
 * The FAQ schema used to be a hand-written copy of faq.js pasted into
 * index.html. It happened to still match — I checked, character by character —
 * but only because nobody had edited an answer yet. The first time someone
 * reworded a reply in faq.js and forgot the HTML, Google would have seen
 * structured data that disagreed with the visible page, and the documented
 * consequence is losing the rich result for the whole page, not just the one
 * question.
 *
 * Deriving it removes the failure mode rather than documenting it.
 *
 * WHAT IT EMITS
 * -------------
 * One @graph containing linked nodes rather than several disconnected blocks.
 * A graph lets every node reference the others by @id — the FAQ has an author,
 * the projects have a creator, the business has a founder — so a search engine
 * reads one connected entity instead of four unrelated documents that happen
 * to sit on the same page.
 */

import { SITE_URL, PERSON_ID, SITE_ID, BUSINESS_ID, PERSON, BUSINESS } from '../app/src/data/seo.js';
import { faqs } from '../app/src/data/faq.js';
import { projects } from '../app/src/data/projects.js';
import { services, processSteps } from '../app/src/data/services.js';
import { technologies } from '../app/src/data/tech.js';

/** Strip the typographic characters JSX uses so the schema matches the DOM text. */
const plain = (s) =>
  String(s)
    .replace(/’/g, '’') // keep curly apostrophes: React renders them too
    .replace(/\s+/g, ' ')
    .trim();

export function buildSchema() {
  // ---- Person ------------------------------------------------------------
  const person = {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON.name,
    givenName: PERSON.givenName,
    familyName: PERSON.familyName,
    url: `${SITE_URL}/`,
    image: PERSON.image,
    email: `mailto:${PERSON.email}`,
    jobTitle: PERSON.jobTitle,
    description: PERSON.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: PERSON.address.locality,
      addressRegion: PERSON.address.region,
      addressCountry: PERSON.address.country,
    },
    knowsLanguage: PERSON.knowsLanguage,
    /* Derived from tech.js, so the list can never disagree with the grid the
     * page actually renders. 30-odd concrete technologies is a far stronger
     * topical signal than a paragraph claiming the same thing in prose. */
    knowsAbout: [...new Set(technologies.map((t) => t.name))],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Full-Stack Developer',
      occupationLocation: {
        '@type': 'City',
        name: `${PERSON.address.locality}, ${PERSON.address.region}, India`,
      },
      /* No `skills` here: it was the knowsAbout list joined into a string,
       * i.e. the same 31 items serialised twice in one document. knowsAbout
       * is the property search engines actually read for topical expertise. */
    },
    sameAs: PERSON.sameAs,
    mainEntityOfPage: { '@id': `${SITE_URL}/#webpage` },
    worksFor: { '@id': BUSINESS_ID },
    /* The domain is the entity's canonical identifier. For a personal brand
     * with an exact-match domain this is the strongest disambiguator
     * available — there is no ORCID, VIAF or Wikidata ID to point at yet. */
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'website',
      value: SITE_URL,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Business enquiries',
      email: `mailto:${PERSON.email}`,
      url: `${SITE_URL}/#contact`,
      availableLanguage: BUSINESS.availableLanguage,
      areaServed: 'Worldwide',
    },
    /* The CV, as a real document with a stable URL rather than an orphan PDF.
     * subjectOf is the correct relation: the document is about the person. */
    subjectOf: { '@id': `${SITE_URL}/#resume` },
  };

  const resume = {
    '@type': 'DigitalDocument',
    '@id': `${SITE_URL}/#resume`,
    name: `${PERSON.name} — CV`,
    url: `${SITE_URL}/resume`,
    encodingFormat: 'application/pdf',
    about: { '@id': PERSON_ID },
    author: { '@id': PERSON_ID },
    inLanguage: 'en',
  };

  // ---- The business ------------------------------------------------------
  const business = {
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: BUSINESS.name,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/images/og-card.png`,
    /* The brand mark, square and on an opaque background — the shape Google
     * expects for a logo. Distinct from `image`, which is the wide OG card. */
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/android-chrome-512x512.png`,
      width: 512,
      height: 512,
    },
    email: `mailto:${PERSON.email}`,
    description: PERSON.description,
    founder: { '@id': PERSON_ID },
    /* A solo practice: the person and the provider are the same entity, and
     * saying so explicitly stops them being read as two competing entities
     * for the same name. */
    employee: { '@id': PERSON_ID },
    serviceType: BUSINESS.serviceType,
    address: {
      '@type': 'PostalAddress',
      addressLocality: PERSON.address.locality,
      addressRegion: PERSON.address.region,
      addressCountry: PERSON.address.country,
    },
    areaServed: BUSINESS.areaServed.map((c) => ({ '@type': 'Country', name: c })),
    availableLanguage: BUSINESS.availableLanguage,
    /* Derived from services.js — the same seven rows the Services section
     * renders, in the same order, with the same wording. */
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Development and infrastructure services',
      /* areaServed is declared ONCE on the parent ProfessionalService and not
       * repeated per service. Repeating eight Country objects across seven
       * offers added ~3.5 KB of JSON-LD that said nothing the provider had
       * not already said — the offers reference the provider by @id, so a
       * consumer follows the link rather than needing a copy. */
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: plain(s.title.replace(/\n/g, ' ')),
          description: plain(s.description),
          serviceType: plain(s.title.replace(/\n/g, ' ')),
          provider: { '@id': BUSINESS_ID },
        },
      })),
    },
  };

  // ---- Projects ----------------------------------------------------------
  /*
   * The single biggest gap before this: four detailed projects, the most
   * substantive content on the page, with no structured data at all. A crawler
   * saw four <h3>s and some prose and had to infer the rest.
   *
   * SoftwareSourceCode when a repository exists (it is literally source code),
   * CreativeWork when it does not, so nothing claims a repo it cannot show.
   */
  const projectNodes = projects.map((p, i) => {
    const node = {
      '@type': p.githubUrl ? 'SoftwareSourceCode' : 'CreativeWork',
      '@id': `${SITE_URL}/#project-${p.id}`,
      name: plain(p.title),
      description: plain(p.description),
      image: `${SITE_URL}${p.image}`,
      author: { '@id': PERSON_ID },
      creator: { '@id': PERSON_ID },
      position: i + 1,
      keywords: p.tech.join(', '),
    };
    if (p.githubUrl) {
      node.codeRepository = p.githubUrl;
      node.programmingLanguage = p.tech;
    }
    if (p.liveUrl) node.url = p.liveUrl;
    /* creativeWorkStatus is how "In development" is stated in a machine
     * readable way, rather than only as a green dot a crawler cannot see. */
    if (p.status) node.creativeWorkStatus = p.status;
    return node;
  });

  const portfolio = {
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#portfolio`,
    name: 'Selected work',
    numberOfItems: projectNodes.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: projectNodes.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@id': p['@id'] },
    })),
  };

  // ---- FAQ ---------------------------------------------------------------
  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    /* Attribution the hand-written version never had: these answers are by a
     * named person with a jobTitle and a location, which is exactly the
     * expertise signal an answer engine looks for before quoting one. */
    author: { '@id': PERSON_ID },
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: plain(f.q),
      acceptedAnswer: {
        '@type': 'Answer',
        text: plain(f.a),
        author: { '@id': PERSON_ID },
      },
    })),
  };

  // ---- How it works ------------------------------------------------------
  /* processSteps renders as four numbered steps on the page; HowTo is the
   * type that says "these are ordered stages of one process" rather than
   * four unrelated headings. */
  const howTo = {
    '@type': 'HowTo',
    '@id': `${SITE_URL}/#process`,
    name: 'How a project runs, from first call to production',
    description: 'Four steps, fixed scope, no surprise invoices.',
    step: processSteps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: plain(s.title),
      text: plain(s.body),
    })),
  };

  // ---- Page and site -----------------------------------------------------
  const webPage = {
    '@type': ['WebPage', 'ProfilePage'],
    '@id': `${SITE_URL}/#webpage`,
    url: `${SITE_URL}/`,
    name: `${PERSON.name} — ${PERSON.jobTitle}`,
    isPartOf: { '@id': SITE_ID },
    about: { '@id': PERSON_ID },
    mainEntity: { '@id': PERSON_ID },
    primaryImageOfPage: { '@id': `${SITE_URL}/#ogimage` },
    significantLink: [`${SITE_URL}/resume`],
    inLanguage: 'en',
    /*
     * NOT ADDED, deliberately:
     *
     *   potentialAction / SearchAction — the sitelinks search box requires a
     *   working search endpoint on the site. There is no search. Declaring
     *   one would be markup describing a feature that does not exist, which
     *   is the definition of the spam Google's structured-data guidelines
     *   prohibit, and it would be ignored at best.
     *
     *   BreadcrumbList — breadcrumbs describe a position in a hierarchy. This
     *   site is one page; there is no hierarchy to describe. Marking up a
     *   fake trail would misrepresent the structure.
     *
     * Both become legitimate the moment real sub-pages exist. See SEO_TODO.md.
     */
  };

  const website = {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: `${SITE_URL}/`,
    name: PERSON.name,
    alternateName: [`${PERSON.name} Portfolio`, `${PERSON.name} — ${PERSON.jobTitle}`],
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID },
  };

  const ogImage = {
    '@type': 'ImageObject',
    '@id': `${SITE_URL}/#ogimage`,
    url: `${SITE_URL}/images/og-card.png`,
    contentUrl: `${SITE_URL}/images/og-card.png`,
    width: 1200,
    height: 630,
    caption: `${PERSON.name} — ${PERSON.jobTitle}`,
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      website,
      webPage,
      ogImage,
      person,
      resume,
      business,
      portfolio,
      ...projectNodes,
      faqPage,
      howTo,
    ],
  };
}

/**
 * Serialise for injection into HTML.
 *
 * `<` is escaped because a literal "</script" anywhere inside a JSON string
 * would terminate the surrounding <script> tag early and break the page. None
 * of the current content contains one, which is exactly why it is worth
 * escaping now rather than after someone writes an FAQ answer about HTML.
 */
export function schemaScriptTag() {
  const json = JSON.stringify(buildSchema()).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}
