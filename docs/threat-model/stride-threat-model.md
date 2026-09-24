# OWASP NodeGoat STRIDE Threat Model

## System Scope

The threat model covers the containerised OWASP NodeGoat application,
including the client-to-web application interface, NodeGoat web
application, MongoDB database, and the data flows between these components.

## Risk Rating

Threats are rated using qualitative likelihood and impact levels:
Low, Medium, and High. The overall risk level is determined by considering
both the likelihood of exploitation and the potential impact.

## Identified Threats

| ID | STRIDE Category | Threat | Affected Component / Data Flow | Likelihood | Impact | Risk | Security Control |
|---|---|---|---|---|---|---|---|
| T1 | Spoofing | Session fixation may allow an attacker to impersonate an authenticated user because the session ID is not regenerated after successful login. | Authentication/session flow - `app/routes/session.js` | Medium | High | High | Regenerate the session ID after successful authentication and apply secure session-cookie settings. |
| T2 | Tampering | Unvalidated `threshold` input is directly interpolated into a MongoDB `$where` expression, creating a NoSQL injection risk that may allow manipulation of database query logic. | NodeGoat to MongoDB data flow - `app/data/allocations-dao.js` | High | High | High | Validate and convert `threshold` to an integer, enforce an allowed range, and avoid constructing `$where` expressions from untrusted input. |
| T3 | Denial of Service | The bank-routing validation uses a regex vulnerable to catastrophic backtracking (ReDoS). Specially crafted input may cause excessive CPU consumption and reduce application availability. | Profile update processing - `app/routes/profile.js` | High | High | High | Replace the vulnerable nested-quantifier regex with a safe expression and enforce strict input length/type validation. |
| T4 | Information Disclosure | The memo functionality retrieves all memo records without filtering them by the authenticated user's identity, potentially exposing memo information across users. | Memos functionality / NodeGoat to MongoDB data flow - `app/routes/memos.js` and `app/data/memos-dao.js` | High | Medium | High | Associate each memo with its owner and restrict database queries to the authenticated user's ID; enforce authorization server-side. |

## Threat Justification

### T1 - Session Fixation (Spoofing)

The login process assigns the authenticated user's ID to the existing
session without regenerating the session identifier. This creates a
potential session fixation condition. The likelihood is rated Medium
because exploitation requires an attacker to obtain or influence a
victim's existing session identifier. The impact is rated High because
successful exploitation could allow impersonation of an authenticated
user and unauthorized access to that user's functionality or data.

**Code location:** `app/routes/session.js`

**Planned control:** Regenerate the session identifier after successful
authentication using `req.session.regenerate()` and review secure
session-cookie configuration.

### T2 - NoSQL Injection (Tampering)

The `getByUserIdAndThreshold()` function incorporates the `threshold`
value into a MongoDB `$where` expression without active validation.
An attacker who can control this input may therefore manipulate the
intended database query logic. The likelihood is rated High because
user-controlled input reaches the query expression without the
commented-out validation. The impact is rated High because successful
query manipulation could affect the application's intended access to
database information.

**Code location:** `app/data/allocations-dao.js`

**Planned control:** Parse the threshold as an integer, enforce an
acceptable numeric range, reject invalid input, and avoid constructing
MongoDB `$where` expressions using untrusted values.

### T3 - Regular Expression Denial of Service (DoS)

The profile update functionality validates the bank routing number using
the regular expression `/([0-9]+)+\#/`. The nested quantifiers can cause
catastrophic backtracking when specially crafted input is processed,
resulting in excessive CPU consumption.

The likelihood is rated High because the bank routing value is obtained
from `req.body` and processed by the vulnerable regular expression during
a profile update. The impact is rated High because excessive CPU
consumption could make the NodeGoat web application slow or unavailable
to legitimate users.

**Code location:** `app/routes/profile.js`

**Planned control:** Replace the vulnerable regular expression with a
non-backtracking alternative and apply strict type, format, and length
validation before processing the bank routing value.

### T4 - Unauthorized Memo Disclosure (Information Disclosure)

The memo functionality obtains the authenticated user's ID from the
session, but the value is not used to restrict which memo records are
retrieved. The `getAllMemos()` function executes `find({})`, which
returns all documents in the memos collection. In addition, newly
created memo documents do not contain an owner identifier.

This creates a potential information-disclosure threat because memo
information is not isolated according to the authenticated user.

The likelihood is rated High because the unrestricted query is part of
the normal memo display functionality. The impact is rated Medium because
the severity depends on the sensitivity of information stored in memos.

**Code locations:**
- `app/routes/memos.js`
- `app/data/memos-dao.js`

**Planned control:** Associate each memo with the authenticated user's
identifier and enforce server-side authorization by querying only records
belonging to that user.