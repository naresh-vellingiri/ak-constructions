# Google Places setup (plot-location suggestions)

The "Let's plan your home" popup has a **Location of your plot** field that
suggests places as the visitor types. It works **without any setup**: it then
suggests Chennai areas from a built-in list (`src/content/chennaiAreas.ts`).
Following this guide switches the suggestions to Google's, which cover any street
or locality.

## Is it free?

Mostly, and for this site's traffic effectively yes — but it needs a billing
account, so read the guard-rails below before creating the key.

Per Google's Maps Platform pricing page (checked October 2026; Google changes
these, so re-check before relying on them):

| What | Allowance | After the allowance |
|---|---|---|
| Autocomplete requests (what this site uses) | **10,000 free per month** | about $2.83 per 1,000 |

- The Google Cloud project **must have billing enabled** (a payment method on the
  account) even though the first 10,000 requests a month cost nothing.
- The site keeps usage low on purpose: nothing is sent until three characters are
  typed, typing is debounced by 300 ms, repeat searches are cached, and a failed
  or rejected call switches to the built-in list instead of retrying. A visitor
  typing one location is about 1 to 3 requests, so 10,000 is several thousand
  enquiries a month.

## Setup (about 10 minutes)

1. Go to <https://console.cloud.google.com/>, create a project (for example
   "AK Website"), and **link a billing account** to it.
2. **APIs & Services > Library**: search for **Places API (New)** and enable it.
   It must be the one marked *(New)*. The legacy "Places API" is closed to new
   projects and will not work.
3. **APIs & Services > Credentials > Create credentials > API key.**
4. Open the key and **restrict it before using it** (see below).
5. Add it to Vercel: **Settings > Environment Variables**, name
   `NEXT_PUBLIC_GOOGLE_PLACES_KEY`, for Production (and Preview if you want).
6. **Redeploy.** `NEXT_PUBLIC_` values are baked in when the site is built, so
   the key does nothing until a new deployment is made.

For local testing add the same line to `.env.local` and restart `npm run dev`.

## Restrict the key (do not skip)

The key ships inside the page's JavaScript, so anyone can read it. Restrictions
are what stop a stranger using it on your bill.

- **Application restrictions: Websites (HTTP referrers)**, allow:
  - `https://www.akconstructionandinteriors.com/*`
  - `https://akconstructionandinteriors.com/*`
  - `http://localhost:3005/*` (development)
- **API restrictions: Restrict key**, choose **Places API (New)** only.

Referrer limits are a speed bump rather than a lock, since a script can fake the
header. So also put a ceiling on spend, which makes surprises impossible:

- **APIs & Services > Places API (New) > Quotas**: set *Autocomplete requests
  per day* to **300**. 300 x 31 days is 9,300, which can never pass the 10,000
  free allowance. If the cap is hit, the site quietly falls back to the built-in
  list for the rest of that visit.
- **Billing > Budgets & alerts**: add a budget of a few dollars with email alerts
  as a second net.

## Things to know

- **Attribution.** Google requires its branding next to its predictions when they
  are not shown on a Google map. The dropdown shows "powered by Google" only when
  Google results are on screen. Google's guidance is to use its official logo
  asset; swap the text for it from the Places policies page if you want to be
  strictly compliant.
- **Nothing is stored from Google.** Only the text the visitor picks or types is
  saved, in the lead's `city` field.
- **Behaviour is unchanged if the key is missing, wrong, or out of quota.** The
  field always accepts typed text, so a Google problem never blocks a lead.
- **Not verified against the live Google API.** The request format follows
  Google's documentation and was tested against a mocked response. The first time
  a real key is added, type a few letters into the field on the live site and
  confirm real suggestions appear. If they do not, open the browser console: a
  403 usually means the referrer list or API restriction above is wrong.
