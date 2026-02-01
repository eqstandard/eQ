# eQ - electronic Quittung
## Design Decisions Log

**Project Name:** eQ (electronic Quittung)  
**Website:** eqstandard.org

**Document Status:** Working Document  
**Date:** 2026-01-31  
**Purpose:** Record key design decisions and their rationale

---

## Core Philosophy

### Privacy by Default

**Decision:** No customer data is stored in or linked to the receipt.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY MODEL                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RECEIPT contains:              RECEIPT does NOT contain:       │
│  ✅ Merchant info               ❌ Customer name                 │
│  ✅ Products purchased          ❌ Customer email                │
│  ✅ Prices, taxes               ❌ Customer address              │
│  ✅ Date/time                   ❌ Customer ID                   │
│  ✅ Signatures                  ❌ Payment card details          │
│                                 ❌ Loyalty card ID               │
│                                                                  │
│  Customer receives: ACCESS TOKEN (like a claim ticket)          │
│  Token allows retrieval but doesn't identify the person         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale:** 
- Receipt is proof of transaction, not proof of identity
- Consumer privacy protected by default
- No GDPR issues - no personal data to protect
- Consumer chooses when/if to link receipt to their systems

---

## 1. Technical Edge Cases

### 1.1 Offline Support

**Decision:** Printed QR code or Airdrop/Bluetooth transfer

**Implementation:**
- Primary: QR code printed on paper or displayed on screen
- Secondary: Airdrop (iOS), Nearby Share (Android), Bluetooth
- QR code contains either full receipt (if small) or retrieval token

```
Consumer at checkout:
┌─────────────────────────────────────────────────────────────────┐
│  "Would you like your receipt?"                                 │
│                                                                  │
│  [Paper]  [QR Code]  [Airdrop]  [No thanks]                    │
│                                                                  │
│  If QR Code selected:                                           │
│  ┌─────────┐                                                    │
│  │ ▄▄▄▄▄▄▄ │  ← Consumer scans with any app                    │
│  │ █ ▀▀▀ █ │     No account needed                              │
│  │ ▀▀▀▀▀▀▀ │     No identification required                     │
│  └─────────┘                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Receipt Size Limits

**Decision:** Two approaches supported:

| Approach | When to Use | How It Works |
|----------|-------------|--------------|
| **Multi-QR** | Medium receipts (3-10KB) | Multiple QR codes, numbered (1/3, 2/3, 3/3) |
| **URL Reference** | Large receipts (>10KB) | QR code contains URL to full JSON |

**Multi-QR Format:**
```
QR Code 1: eq://v1/multi/1of3/{base64-chunk-1}
QR Code 2: eq://v1/multi/2of3/{base64-chunk-2}
QR Code 3: eq://v1/multi/3of3/{base64-chunk-3}
```

**URL Reference Format:**
```
eq://v1/fetch/{receipt-id}?m={merchant-domain}&t={access-token}
```

### 1.3 Refund/Return Linking

**Decision:** Reference original receipt by ID; customer must present original.

**Implementation:**
```json
{
  "receipt_type": "refund",
  "refund_info": {
    "original_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_date": "2026-01-15",
    "original_merchant_hash": "sha256:abc123...",
    "reason": "customer_return"
  }
}
```

**Process:**
1. Customer presents original receipt (digital or token)
2. Merchant creates refund receipt with `receipt_type: "refund"`
3. Refund receipt references original via `original_receipt_id`
4. Both receipts remain valid; refund receipt shows negative amounts

### 1.4 Split Transactions

**Decision:** Support both single-receipt and multi-receipt approaches.

| Scenario | Approach |
|----------|----------|
| Customer wants unified record | Single receipt, multiple payments listed |
| Merchant prefers per-payment | Multiple receipts, linked via `transaction_group_id` |

**Single Receipt (Multiple Payments):**
```json
{
  "transaction": {
    "payments": [
      { "method": "card", "amount": 50.00, "card_brand": "Visa" },
      { "method": "card", "amount": 30.00, "card_brand": "Mastercard" },
      { "method": "cash", "amount": 20.00 }
    ]
  },
  "totals": {
    "grand_total": 100.00
  }
}
```

**Multiple Receipts (Linked):**
```json
{
  "transaction": {
    "transaction_group_id": "GRP-2026-001",
    "transaction_group_index": 1,
    "transaction_group_total": 3
  }
}
```

### 1.5 Gift Receipts

**Decision:** Not a separate receipt type. Financial information remains on receipt.

**Rationale:**
- Receipt proves purchase for warranty
- If gifting, giver provides receipt to recipient
- Privacy already protected (no customer ID on receipt)
- Simplicity over edge case optimization

### 1.6 Partial Returns

**Decision:** Create new refund receipt linked to original, specifying returned items.

```json
{
  "receipt_type": "refund",
  "refund_info": {
    "original_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "partial_return": true
  },
  "items": [
    {
      "line_number": 1,
      "description": "Blue T-Shirt (RETURNED)",
      "quantity": -1,
      "unit_price": 29.90,
      "total_price": -29.90,
      "original_line_number": 2
    }
  ]
}
```

### 1.7 Corrections

**Decision:** Mark original receipt as voided; issue new corrected receipt.

**Process:**
1. Original receipt status set to `"voided"` (via update or new void receipt)
2. New receipt issued with `receipt_type: "correction"`
3. Correction references original

```json
{
  "receipt_type": "correction",
  "correction_info": {
    "original_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "reason": "Incorrect price applied",
    "voided_original": true
  }
}
```

---

## 2. Long-Term Validity

### 2.1 Retention Period

**Decision:** Standard supports receipts for 10+ years, but user responsibility after 3 years.

| Period | Responsibility |
|--------|----------------|
| 0-3 years | Merchant MUST retain and serve receipt |
| 3-10 years | Merchant SHOULD retain; user SHOULD have local copy |
| 10+ years | User responsibility; archive services available |

### 2.2 Merchant Goes Out of Business

**Decision:** Merchants can migrate receipts to archive service providers.

**Implementation:**
- Standard defines archive service provider interface
- Merchant can transfer receipt hosting to archive provider
- Receipt URL can redirect to archive provider
- Consumer's token remains valid

```
Before closure:
  https://oldshop.ch/eq/receipts/xxx → Receipt JSON

After closure (redirect):
  https://oldshop.ch/eq/receipts/xxx 
    → 301 Redirect → https://archive.eqstandard.org/oldshop.ch/xxx
```

### 2.3 Certificate Expiration & Key Rotation

**Decision:** Certificate chain history preserved (similar to DNSSEC).

**Implementation:**
```json
{
  "signatures": {
    "merchant": {
      "key_id": "merchant-key-2026-01",
      "certificate_url": "https://shop.ch/.well-known/eq/cert.pem",
      "signature": "..."
    }
  }
}
```

**Certificate Chain File:**
```
/.well-known/eq/cert-history.json
{
  "current": "merchant-key-2026-01",
  "history": [
    {
      "key_id": "merchant-key-2026-01",
      "valid_from": "2026-01-01",
      "valid_to": "2028-01-01",
      "certificate_url": "cert-2026.pem"
    },
    {
      "key_id": "merchant-key-2024-01",
      "valid_from": "2024-01-01",
      "valid_to": "2026-01-01",
      "certificate_url": "cert-2024.pem",
      "superseded_by": "merchant-key-2026-01"
    }
  ]
}
```

### 2.4 Algorithm Deprecation

**Decision:** Standard designed for algorithm agility.

**Principles:**
- Algorithm specified in signature block (not hardcoded)
- Multiple algorithms can be valid simultaneously
- Transition periods announced in advance
- Old receipts remain valid with old algorithms

```json
{
  "signatures": {
    "merchant": {
      "algorithm": "ES256",  // Explicit, not assumed
      // Future: "algorithm": "ES384" or "DILITHIUM3" (post-quantum)
    }
  }
}
```

### 2.5 Archive Service

**Decision:** Standard defines optional archive service interface.

**Use cases:**
- Merchant closure
- Long-term warranty receipts
- Consumer backup preference

---

## 3. Privacy & Anonymity

### 3.1 No Customer Data

**Decision:** Receipts contain ZERO customer information.

**What's NOT on the receipt:**
- ❌ Customer name
- ❌ Customer email
- ❌ Customer phone
- ❌ Customer address
- ❌ Loyalty card number
- ❌ Payment card number (even masked)
- ❌ Any customer identifier

### 3.2 Access Model

**Decision:** Token-based access without identification.

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN-BASED ACCESS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Customer pays (any method: cash, card, etc.)                │
│                                                                  │
│  2. POS generates:                                              │
│     • Receipt (no customer data)                                │
│     • Access token (random, not linked to identity)             │
│                                                                  │
│  3. Customer receives token via:                                │
│     • QR code (printed or on screen)                            │
│     • Airdrop/Bluetooth                                         │
│     • NFC tap                                                   │
│                                                                  │
│  4. Customer can:                                               │
│     • Import to personal finance app                            │
│     • Import to accounting software                             │
│     • Store in warranty tracker                                 │
│     • Ignore/discard                                            │
│                                                                  │
│  TOKEN ≠ IDENTITY                                               │
│  Having the token = having the receipt (like a coat check)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Opt-In at Payment

**Decision:** Customer chooses at payment time whether to receive digital receipt.

```
"Would you like a digital receipt?"
  [Yes - QR]  [Yes - Airdrop]  [No thanks]

If "No thanks":
  - No token generated
  - No receipt stored for retrieval
  - Optional: Paper receipt printed
```

### 3.4 Sensitive Purchases

**Decision:** No special handling needed - privacy already protected.

**Rationale:** Since no customer data is on the receipt, there's no way to link a pharmacy purchase to a person. The receipt only proves "someone bought this item at this store."

---

## 4. Legal & Compliance

### 4.1 Legal Validity

**Decision:** Design for legal validity as proof of purchase.

**Requirements for legal validity:**
- Merchant identification (name, address, tax ID)
- Transaction timestamp
- Itemized list with prices
- Tax breakdown
- Cryptographic signature (authenticity)
- Unique receipt ID (non-repudiation)

### 4.2 Tax Authority Acceptance

**Research completed:**

| Authority | Status | Key Requirements |
|-----------|--------|------------------|
| **Swiss ESTV** | ✅ Digital accepted | VAT returns must be electronic from 2025; digital records accepted |
| **German Finanzamt** | ✅ Digital accepted | Must comply with GoBD (see below) |

**German GoBD Requirements (eQ can comply):**
- Traceability and verifiability ✅ (signature, receipt ID)
- Completeness and accuracy ✅ (schema validation)
- Immutability ✅ (cryptographic signature)
- 10-year retention ✅ (archive service support)
- Machine-readable format ✅ (JSON)
- Tax authority data access ✅ (standard API)

**Key point from GoBD 2024/2025:** 
> "Documents received in paper form can be scanned or captured using smartphones/cameras. After proper image capture, paper documents may be destroyed."

This means eQ receipts (born digital) are equally valid - actually better since they're never paper.

**Recommendation:** Include GoBD compliance statement in specification.

### 4.3 Retention Requirements

**Decision:** User responsibility for retention.

| Jurisdiction | Legal Requirement | eQ Approach |
|--------------|-------------------|---------------|
| Switzerland | 10 years (business) | Merchant: 3 years; User: remainder |
| Germany | 10 years (business) | Merchant: 3 years; User: remainder |
| Personal use | Varies | User decides |

### 4.4 E-Commerce

**Decision:** Delivery address NOT required on receipt.

**Rationale:**
- Receipt = proof of purchase
- Delivery confirmation = separate document
- Keeps receipt simple and privacy-preserving

**If needed:** E-commerce extension can add delivery reference:
```json
{
  "extensions": {
    "eq:ecommerce": {
      "order_id": "ORD-12345",
      "delivery_tracking": "https://shipping.com/track/xxx"
    }
  }
}
```

### 4.5 Cross-Border VAT Refund

**Decision:** Consumer provides digital receipts to refund agency.

**Flow:**
1. Tourist makes purchase, receives eQ receipt
2. At border/airport, presents receipts to refund agency
3. Agency verifies signatures (proves authentic purchase)
4. Agency processes VAT refund

---

## 5. Adoption & Migration

### 5.1 Migration Path

**Decision:** POS software providers implement eQ export.

**Phases:**
1. POS vendors add eQ export option
2. Merchants enable eQ alongside paper
3. Gradual consumer adoption
4. Paper becomes optional fallback

### 5.2 Small Business Support

**Decision:** Free web service for small businesses.

**Concept:** `receipts.eqstandard.org` (or similar)
- Free hosted service
- Merchant registers, gets subdomain
- Generates receipts, hosts them
- Consumer scans QR, retrieves from service

```
Small shop workflow:
1. Register at receipts.eqstandard.org → "myshop.receipts.eqstandard.org"
2. Use simple web interface or mobile app
3. Enter sale details → generates QR code
4. Customer scans QR → gets eQ receipt
```

### 5.3 Hybrid Period

**Decision:** Standard supports parallel paper and digital.

- Receipt can indicate `"paper_issued": true`
- No conflict between systems
- Consumer choice respected

### 5.4 Consumer Education

**Decision:** Self-explanatory UX + commercial awareness campaigns.

**The QR code approach is familiar:**
- People know how to scan QR codes
- "Scan for your receipt" is intuitive
- No app download required initially (browser works)

### 5.5 POS Vendor Incentives

**Decision:** Hardware cost savings pitch.

**Savings:**
- No receipt paper rolls
- No thermal printer maintenance
- No printer hardware
- Faster checkout
- Environmental credentials

---

## 6. Ecosystem Governance

### 6.1 Extension Approval

**Decision:** Tiered extension system.

| Tier | Prefix | Approval |
|------|--------|----------|
| **Core** | `eq:` | Working Group consensus |
| **Community** | `community:` | Published, peer-reviewed |
| **Custom** | `{company}:` | No approval needed |

**Process for `eq:` extensions:**
1. Proposal submitted as GitHub issue
2. Working Group discussion
3. Draft specification
4. Public comment period (30 days)
5. Working Group vote
6. Integration into spec

### 6.2 Certification Program

**Decision:** Avoid formal certification initially.

**Alternative approach:**
- Self-certification against test suite
- Open source validation tools
- Community-maintained compatibility list
- "eQ Compatible" requires passing test suite

### 6.3 Dispute Resolution

**Decision:** Free web service for receipt verification.

**Tool at `verify.eqstandard.org`:**
- Upload/paste receipt JSON
- Automatic validation
- Signature verification
- Schema compliance check
- Clear pass/fail result

### 6.4 Liability

**Decision:** Standard defines verification process; liability follows normal commercial law.

- If receipt is validly signed → merchant issued it
- If signature invalid → receipt not trustworthy
- Verification tools reduce disputes

### 6.5 Trademark

**Decision:** "eQ Compatible" usage requires passing official test suite.

```
To use "eQ Compatible" badge:
1. Implementation passes official test suite
2. Self-declare compliance (no fee)
3. Add to community compatibility list
4. Badge usage permitted
```

---

## 7. Internationalization (i18n)

### 7.1 Multi-Language

**Decision:** All languages supported; locale code determines display.

**Data storage:** UTF-8, language-neutral where possible

**Display:** Application uses locale settings

```json
{
  "items": [
    {
      "description": "Milch / Lait / Latte",  // Multi-language OK
      // OR
      "description": "Milk",
      "description_i18n": {
        "de": "Milch",
        "fr": "Lait",
        "it": "Latte"
      }
    }
  ]
}
```

### 7.2 Number & Date Formats

**Decision:** Storage in neutral format; display per locale.

| Data | Storage Format | Display |
|------|----------------|---------|
| Numbers | `1234.56` (decimal point) | Per locale |
| Dates | ISO 8601 (`2026-01-31T14:30:00+01:00`) | Per locale |
| Currency amounts | Decimal number | Per locale |

### 7.3 RTL & Character Languages

**Decision:** Full support required.

**Requirements:**
- UTF-8 encoding (supports all characters)
- No assumptions about text direction
- Arabic, Hebrew, Chinese, Japanese, Korean all valid
- Applications handle display direction

### 7.4 Currency Display

**Decision:** Store currency code; display per locale.

```json
{
  "currency": "CHF",        // ISO 4217 code
  "grand_total": 99.90      // Numeric value
}
```

**Display examples (same data):**
- `de-CH`: `CHF 99.90`
- `fr-CH`: `99.90 CHF`
- `de-DE`: `99,90 CHF`

---

## 8. Error Handling

### 8.1 Malformed Receipts

**Decision:** Report to merchant; apps should be lenient.

**Principles:**
- Be strict in what you produce
- Be lenient in what you accept
- Log errors for merchant feedback
- Display what's valid; flag what's not

### 8.2 Unknown Extensions

**Decision:** Graceful degradation; ignore unknown extensions.

```
App sees extension it doesn't understand:
  → Log it
  → Ignore it
  → Continue processing rest of receipt
  → Display warning: "Some data not displayed"
```

### 8.3 Signature Verification Failure

**Decision:** Distinguish network errors from invalid signatures.

```
Verification flow:
1. Check network connectivity
2. If offline → "Cannot verify (offline)"
3. If online → attempt verification
4. If certificate fetch fails → "Cannot verify (network error)"
5. If signature invalid → "INVALID - may be forged"
```

### 8.4 Merchant API Down

**Decision:** Implement retry with exponential backoff.

```
Retry policy:
  Attempt 1: Immediate
  Attempt 2: Wait 2 seconds
  Attempt 3: Wait 4 seconds
  Attempt 4: Wait 8 seconds
  Attempt 5: Wait 16 seconds
  Then: "Service temporarily unavailable. Try later."

Cache successful fetches locally.
```

---

## Summary: Key Design Principles

1. **Privacy by default** - No customer data on receipts
2. **Token-based access** - Like a coat check ticket
3. **User responsibility** - After 3 years, user maintains their receipts
4. **Graceful degradation** - Handle errors without crashing
5. **Algorithm agility** - Future-proof crypto
6. **Offline-first** - QR codes work without internet
7. **Locale-aware** - Store neutral, display per locale
8. **No certification bureaucracy** - Self-certify with test suite

---

*This document records design decisions. Final specifications are in 02_TECHNICAL_SPECIFICATION.md*
