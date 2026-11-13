// Links to the website and to the other apps of the suite.

export const WEBSITE = 'https://haddingtonbible.org'
export const PRIVACY_URL = `${WEBSITE}/privacy/`
export const REPO_URL = 'https://github.com/3stacks/self-interpreting-bible'
export const ISSUES_URL = `${REPO_URL}/issues`
export const KOFI = 'https://ko-fi.com/lukeboyle'
export const HEARERS = 'https://hearers.app'
export const PRECENTOR = 'https://precentor.app'
export const COVENANT_HOUSEHOLD = 'https://covenanthousehold.app'

/** Add a verse to "My verses" in Hearers. The id is a Hearers passage id: "John.3.16". */
export const memoriseInHearers = (code: string, chapter: number, verse: number) =>
  `${HEARERS}/app/#/add/${code}.${chapter}.${verse}`

/** Sing a psalm of the 1650 Scottish Psalter in Precentor. */
export const singInPrecentor = (psalm: number) => `${PRECENTOR}/psalm/${String(psalm).padStart(3, '0')}`

/** The same chapter on the website. */
export const onWebsite = (slug: string, chapter: number) => `${WEBSITE}/${slug}-${chapter}`
