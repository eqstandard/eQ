# eQ - electronic Quittung
## Technical Specification v0.1

**Project Name:** eQ (electronic Quittung)  
**Website:** eqstandard.org

**Document Status:** Draft  
**Date:** 2026-01-31  
**Target Format:** JSON with JSON Schema validation

---

## 1. Design Principles

### 1.1 Core Design Goals

| Principle | Rationale |
|-----------|-----------|
| **Human-readable** | JSON format, clear field names |
| **Machine-processable** | Strict schema, no ambiguity |
| **Minimal by default** | Only essential fields required; extensions for optional data |
| **Privacy-preserving** | No customer PII required in core; opt-in extensions |
| **Decentralized** | Data stays with merchant; no central database of purchases |
| **Forgery-proof** | Cryptographic signatures ensure authenticity and integrity |
| **Internationally compatible** | Multi-currency, multi-language, regional tax support |
| **Backward compatible** | Semantic versioning; old receipts remain valid |

### 1.2 Format Choice: JSON

**Why JSON over XML:**
- Smaller payload size
- Native support in JavaScript/web environments
- Easier for developers to read and debug
- JSON Schema provides robust validation
- Better tooling ecosystem (2020s standard)

**Compatibility:** Provide XML transformation for systems requiring XML (e.g., legacy ERP).

---

## 2. Decentralized Architecture

### 2.1 Core Principle: Merchant-Hosted Data

**The receipt data stays with the merchant.** There is no central database of all receipts.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DECENTRALIZED MODEL                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐            │
│   │ Merchant │         │ Merchant │         │ Merchant │            │
│   │    A     │         │    B     │         │    C     │            │
│   │ ┌──────┐ │         │ ┌──────┐ │         │ ┌──────┐ │            │
│   │ │Data A│ │         │ │Data B│ │         │ │Data C│ │            │
│   │ └──────┘ │         │ └──────┘ │         │ └──────┘ │            │
│   └────┬─────┘         └────┬─────┘         └────┬─────┘            │
│        │                    │                    │                  │
│        ▼                    ▼                    ▼                  │
│   ┌─────────────────────────────────────────────────────┐           │
│   │              Consumer's App / Wallet                │           │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │           │
│   │  │Token A  │  │Token B  │  │Token C  │   (tokens    │           │
│   │  │+ ref    │  │+ ref    │  │+ ref    │   not data)  │           │
│   │  └─────────┘  └─────────┘  └─────────┘              │           │
│   └─────────────────────────────────────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Decentralized?

| Benefit | Explanation |
|---------|-------------|
| **Privacy** | No single entity sees all consumer purchases |
| **No honeypot** | No central database to hack or subpoena |
| **GDPR compliant** | Data stays with original controller (merchant) |
| **Scalable** | No central infrastructure bottleneck |
| **Resilient** | No single point of failure |
| **Merchant control** | Merchants retain their customer data |

### 2.3 Consumer Access Model

When a consumer makes a purchase, they receive:

1. **Access Token** - Cryptographic proof of purchase entitlement
2. **Receipt Reference** - Pointer to where the receipt is stored
3. **Merchant Endpoint** - Where to fetch the full receipt

```json
{
  "access_token": "eyJhbGciOiJFUzI1NiIs...",
  "receipt_ref": {
    "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "merchant_domain": "shop.example.ch",
    "endpoint": "https://shop.example.ch/eq/v1/receipts/",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "expires_at": "2036-01-31T14:30:00+01:00"
  }
}
```

**Consumer options:**
- **Fetch on demand:** App retrieves receipt from merchant when needed
- **Cache locally:** Consumer can download and store full receipt
- **Delete token:** Consumer can discard access (merchant still has data for legal retention)

### 2.4 Crawler Protection

To prevent data mining and scraping of receipt data:

| Protection | Implementation |
|------------|----------------|
| **Random IDs** | Receipt IDs are UUID v4 (cryptographically random), not sequential |
| **Token-based access** | Must present valid access token to retrieve receipt |
| **Token binding** | Tokens bound to consumer's app/device (optional) |
| **Rate limiting** | Merchant APIs enforce request limits |
| **Token expiration** | Access tokens can expire (configurable, default: 10 years) |
| **No enumeration** | API returns 404 for invalid IDs (no difference from non-existent) |

**Anti-scraping measures:**

```
❌ GET /receipts/1          → Sequential = scrapable
❌ GET /receipts/2          
❌ GET /receipts/3          

✅ GET /receipts/550e8400-e29b-41d4-a716-446655440000  → Random UUID
   Authorization: Bearer <access_token>                → Requires token
   → Rate limited, logged, monitored
```

### 2.5 Merchant API Requirements

Merchants implementing eQ must provide:

```
GET  /eq/v1/receipts/{receipt-id}
     Authorization: Bearer {access-token}
     Accept: application/json
     
Response: Full eQ receipt JSON (if token valid)
          404 (if invalid ID or token)
          429 (if rate limited)
```

**Minimum retention:** Merchants SHOULD retain receipts for legal minimum (typically 10 years for tax purposes).

---

## 3. Security & Forgery Protection

### 3.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| **Forged receipt** | Cryptographic signature by merchant |
| **Fake vendor claim** | Domain binding + certificate verification (see 3.4) |
| **Tampered receipt** | Hash integrity check |
| **Replay attack** | Unique receipt ID, timestamp |
| **Impersonation** | Certificate chain verification |
| **Fraudulent warranty** | Third-party verification via merchant's public key |
| **Data mining** | Decentralization + access tokens |
| **Bulk scraping** | Rate limiting + random IDs |

### 3.2 Cryptographic Signatures (Required for Authenticity)

Every eQ receipt SHOULD include a merchant signature. Receipt and signature SHALL be in the **same** JSON document (one response, one file). Signature is **detached** (stored in `signatures`, not wrapping the payload) but computed over the **entire** receipt (or scope in `signed_fields`). Any change to signed content invalidates the signature.

- **Canonicalization:** RFC 8785 (JCS) before signing.
- **Envelope:** RFC 7515 (JWS) detached mode. Algorithms: ES256 (recommended), RS256 (allowed).
- **Verifiers:** MUST verify signature over full signed scope; if verification fails, treat receipt as invalid.

```json
{
  "signatures": {
    "merchant": {
      "algorithm": "ES256",
      "key_id": "merchant-key-2026-01",
      "certificate_url": "https://shop.example.ch/.well-known/eq/cert.pem",
      "signed_fields": ["receipt"],
      "signature": "MEUCIQDf4...base64...signature"
    }
  }
}
```

### 3.3 Signature Verification Process

```
1. Retrieve merchant's public key from certificate_url
2. Verify certificate chain (root CA → intermediate → merchant)
3. Extract signed_fields from receipt
4. Compute hash of signed content
5. Verify signature using public key
6. Check certificate validity (not expired, not revoked)
```

**Certificate discovery:**
```
https://{merchant-domain}/.well-known/eq/cert.pem
https://{merchant-domain}/.well-known/eq/cert-chain.pem
```

### 3.4 Vendor Verification (Anti-Fraud Protection)

**Critical requirement:** Prevent forged receipts from being used for fraudulent warranty claims.

#### The Fraud Scenario We Prevent

```
WITHOUT VENDOR VERIFICATION:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Fraudster creates fake receipt:                                │
│  ┌─────────────────────────┐                                    │
│  │ Receipt from: Apple AG  │                                    │
│  │ Item: iPhone 15 Pro     │  ← Completely fabricated           │
│  │ Price: CHF 1,299        │                                    │
│  │ Date: 2026-01-15        │                                    │
│  └─────────────────────────┘                                    │
│              │                                                  │
│              ▼                                                  │
│  Fraudster claims warranty → Apple must honor? 😱               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

WITH eQ VENDOR VERIFICATION:
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Fraudster creates fake receipt:                                │
│  ┌─────────────────────────┐                                    │
│  │ Receipt from: Apple AG  │                                    │
│  │ Signature: ??? ❌       │  ← Cannot sign without Apple's    │
│  └─────────────────────────┘    private key                     │
│                                                                 │
│  Verifier checks:                                               │
│  1. Get Apple's public key from apple.com/.well-known/eq/       │
│  2. Verify signature → FAILS ❌                                 │
│  3. Reject warranty claim                                       │
│                                                                 │
│  ✅ Fraud prevented                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Domain Binding Rule

**The merchant domain in the receipt MUST match the certificate domain.**

```json
{
  "receipt": {
    "merchant": {
      "name": "TechStore AG",
      "website": "https://techstore.ch"     // ← Domain claim
    }
  },
  "signatures": {
    "merchant": {
      "certificate_url": "https://techstore.ch/.well-known/eq/cert.pem"
      // ↑ Certificate MUST be from same domain
    }
  }
}
```

**Verification rule:**
```
IF merchant.website domain ≠ certificate domain THEN
    REJECT receipt as potentially forged
```

#### Third-Party Verification Flow

When a warranty provider, bank, or other party needs to verify a receipt:

```
┌─────────────────────────────────────────────────────────────────┐
│              RECEIPT VERIFICATION BY THIRD PARTY                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Consumer presents receipt to Warranty Provider                 │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │ 1. Extract merchant domain from receipt │                    │
│  │    → "techstore.ch"                     │                    │
│  └─────────────────────────────────────────┘                    │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │ 2. Fetch certificate from merchant      │                    │
│  │    GET techstore.ch/.well-known/eq/     │                    │
│  │    cert.pem                             │                    │
│  └─────────────────────────────────────────┘                    │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │ 3. Verify certificate chain             │                    │
│  │    Root CA → Intermediate → Merchant    │                    │
│  │    (like HTTPS/TLS verification)        │                    │
│  └─────────────────────────────────────────┘                    │
│                    │                                            │
│                    ▼                                            │
│  ┌─────────────────────────────────────────┐                    │
│  │ 4. Verify signature on receipt          │                    │
│  │    Using merchant's public key          │                    │
│  └─────────────────────────────────────────┘                    │
│                    │                                            │
│          ┌────────┴────────┐                                    │
│          ▼                 ▼                                    │
│    ┌──────────┐      ┌──────────┐                               │
│    │ VALID ✅ │      │INVALID ❌│                              │
│    │          │      │          │                               │
│    │ Process  │      │ Reject   │                               │
│    │ warranty │      │ claim    │                               │
│    └──────────┘      └──────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Why This Works (Like HTTPS)

The verification model is similar to how browsers verify websites:

| HTTPS (Websites) | eQ (Receipts) |
|------------------|-----------------|
| Browser fetches certificate from website | Verifier fetches certificate from merchant domain |
| Certificate proves domain ownership | Certificate proves merchant identity |
| CA (Certificate Authority) vouches for identity | Same CA infrastructure |
| Cannot forge without private key | Cannot forge receipt without merchant's private key |

#### Certificate Requirements

Merchants MUST:
1. Obtain a certificate from a recognized Certificate Authority (CA)
2. Host certificate at `/.well-known/eq/cert.pem`
3. Sign all receipts with corresponding private key
4. Keep private key secure (if compromised, revoke immediately)

#### Verification API Endpoint (Optional)

Merchants MAY provide a verification endpoint:

```
POST https://techstore.ch/eq/v1/verify
Content-Type: application/json

{
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "signature": "MEUCIQDf4...base64..."
}

Response:
{
  "valid": true,
  "issued_at": "2026-01-31T14:30:00+01:00",
  "merchant_verified": true
}
```

This allows warranty providers to verify directly with the merchant.

### 3.5 Fiscal Compliance Signatures

For jurisdictions requiring fiscal device signatures (e.g., Germany TSE, Austria RKS):

```json
{
  "signatures": {
    "merchant": { ... },
    "fiscal": {
      "country": "DE",
      "scheme": "TSE",
      "device_id": "TSE-DEVICE-001",
      "transaction_number": 12345,
      "signature_counter": 67890,
      "start_time": "2026-01-31T14:29:55+01:00",
      "end_time": "2026-01-31T14:30:00+01:00",
      "signature": "base64-encoded-tse-signature",
      "public_key": "base64-encoded-public-key"
    }
  }
}
```

### 3.5 Receipt Integrity Hash

For quick integrity verification without full signature check:

```json
{
  "integrity": {
    "algorithm": "SHA-256",
    "hash": "a]9f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b...",
    "scope": "receipt"
  }
}
```

### 3.6 Jurisdiction Extensions (Optional)

**Austria (RKSV):** Use `jurisdiction.at.rksv` with e.g. `kassen_id`, `receipt_number`, `encrypted_turnover_counter`, `previous_receipt_hash`, `signature`, `scu_provider`. Fiscal middleware (e.g. fiskaltrust) produces the RKSV signature; eQ carries it.

**Switzerland:** Use `jurisdiction.ch` with e.g. `uid`, `mwst_number`, `retention_years`, `gebuev_compliant`. eQ signatures satisfy GeBüV integrity; JSON is non-proprietary for retention.

---

## 4. Receipt Data Model

### 4.1 High-Level Structure

```
Receipt
├── metadata (version, id, timestamps)
├── merchant (seller information)
├── transaction (payment details)
├── items[] (line items)
├── taxes[] (tax breakdown)
├── totals (summary amounts)
├── extensions{} (optional modules)
└── signatures{} (optional integrity)
```

### 4.2 Complete Schema Overview

```json
{
  "$schema": "https://eqstandard.org/schema/v1/receipt.json",
  "eq_version": "1.0.0",
  
  "receipt": {
    "id": "string (UUID)",
    "issued_at": "ISO 8601 datetime",
    "timezone": "IANA timezone",
    "receipt_type": "enum: sale | refund | void | correction",
    "receipt_number": "string (merchant's reference)",
    
    "merchant": { },
    "location": { },
    "transaction": { },
    "items": [ ],
    "taxes": [ ],
    "totals": { },
    
    "extensions": { },
    "signatures": { }
  }
}
```

---

### 4.3 Core Objects

#### 4.3.1 Metadata (Required)

```json
{
  "eq_version": "1.0.0",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "sale",
    "receipt_number": "R-2026-00001234",
    "currency": "CHF"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eq_version` | string | Yes | Semantic version of eQ spec |
| `id` | UUID | Yes | Globally unique receipt identifier |
| `issued_at` | ISO 8601 | Yes | Timestamp with timezone offset |
| `timezone` | string | Yes | IANA timezone identifier |
| `receipt_type` | enum | Yes | sale, refund, void, correction |
| `receipt_number` | string | No | Merchant's internal reference |
| `invoice_number` | string | No | Sequential invoice number (e.g. for Art. 226) |
| `supply_date` | date | No | Date supply made/completed (if ≠ issued_at) |
| `currency` | ISO 4217 | Yes | 3-letter currency code |

### 3.1.1 Receipt Types

| Type | Usage |
|------|-------|
| `sale` | Standard purchase receipt |
| `refund` | Full or partial return/refund |
| `void` | Cancels a previous receipt |
| `correction` | Replaces an incorrect receipt |

### 3.1.2 Refund Receipts

For refunds and returns, include `refund_info`:

```json
{
  "receipt_type": "refund",
  "refund_info": {
    "original_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "original_date": "2026-01-15",
    "original_merchant_hash": "sha256:abc123def456...",
    "partial_return": true,
    "reason": "customer_return"
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
  ],
  "totals": {
    "grand_total": -29.90
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `original_receipt_id` | UUID | Yes | ID of the original purchase receipt |
| `original_date` | date | No | Date of original purchase |
| `original_merchant_hash` | string | No | Hash for matching without full ID |
| `partial_return` | boolean | No | True if only some items returned |
| `reason` | string | No | Reason code for return |

**Reason codes:**
- `customer_return` - Customer changed mind
- `defective` - Product defective
- `wrong_item` - Wrong item delivered/sold
- `price_adjustment` - Price correction
- `other` - Other reason

### 3.1.3 Void Receipts

To cancel a receipt entirely:

```json
{
  "receipt_type": "void",
  "void_info": {
    "voided_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
    "voided_at": "2026-01-31T14:35:00+01:00",
    "reason": "customer_cancelled"
  }
}
```

### 3.1.4 Correction Receipts

To replace an incorrect receipt:

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

**Process:**
1. Original receipt marked as voided (via void receipt or flag)
2. Correction receipt issued with correct information
3. Both receipts reference each other via IDs

### 3.1.5 Split Transaction Support

For transactions split across multiple payments:

**Option A: Single receipt, multiple payments**
```json
{
  "transaction": {
    "payments": [
      { "method": "card", "amount": 50.00, "card_brand": "Visa" },
      { "method": "card", "amount": 30.00, "card_brand": "Mastercard" },
      { "method": "cash", "amount": 20.00 }
    ]
  },
  "totals": { "grand_total": 100.00 }
}
```

**Option B: Multiple receipts, linked**
```json
{
  "transaction": {
    "transaction_group_id": "GRP-2026-001",
    "transaction_group_index": 1,
    "transaction_group_count": 3
  }
}
```

---

### 3.2 Merchant (Required)

```json
{
  "merchant": {
    "name": "Example Store AG",
    "legal_name": "Example Retail Holdings AG",
    "tax_id": "CHE-123.456.789",
    "tax_id_type": "CH_UID",
    "address": {
      "line1": "Bahnhofstrasse 1",
      "line2": null,
      "city": "Zürich",
      "postal_code": "8001",
      "subdivision": "ZH",
      "country": "CH"
    },
    "address_standard": "EN16931",
    "contact": {
      "phone": "+41 44 123 45 67",
      "email": "info@example-store.ch",
      "website": "https://example-store.ch"
    },
    "identifiers": {
      "gln": "7612345000001"
    }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Trading name |
| `legal_name` | string | No | Official registered name |
| `tax_id` | string | Yes* | Tax registration number (*jurisdiction dependent) |
| `tax_id_type` | enum | Yes* | Type of tax ID (VAT, UID, etc.) |
| `address` | object | Yes | Business address (see address structure below) |
| `address_standard` | string | No | Hint: `EN16931` \| `ISO20022` \| `local` — which guidance was used to fill address |
| `contact` | object | No | Contact information |
| `identifiers.gln` | string | No | GS1 Global Location Number |

**Address structure:** `line1` (required), `line2` (optional), `city` (required), `postal_code` (required where applicable), `subdivision` (optional, e.g. canton/state), `country` (required, ISO 3166-1 alpha-2). Content may be filled per EN 16931, ISO 20022, or local norms. Deprecated: `street` — map to `line1` if present.

---

### 3.3 Location (Optional)

For multi-location merchants:

```json
{
  "location": {
    "name": "Zürich Hauptbahnhof",
    "location_id": "LOC-001",
    "address": {
      "line1": "Bahnhofplatz 15",
      "line2": null,
      "city": "Zürich",
      "postal_code": "8001",
      "subdivision": "ZH",
      "country": "CH"
    },
    "identifiers": {
      "gln": "7612345000018"
    }
  }
}
```

(Same address structure as merchant: line1, line2, city, postal_code, subdivision, country.)

---

### 3.4 Transaction (Required)

```json
{
  "transaction": {
    "transaction_id": "TXN-2026013114300001",
    "terminal_id": "POS-003",
    "operator_id": "EMP-042",
    "payments": [
      {
        "method": "card",
        "amount": 47.80,
        "card_type": "debit",
        "card_brand": "Visa",
        "card_last_four": "1234",
        "authorization_code": "ABC123"
      }
    ],
    "change_given": 0.00
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `transaction_id` | string | Yes | Unique transaction reference |
| `terminal_id` | string | No | POS terminal identifier |
| `operator_id` | string | No | Cashier/operator identifier |
| `payments` | array | Yes | One or more payment methods |
| `payments[].method` | enum | Yes | cash, card, mobile, voucher, other |
| `payments[].amount` | decimal | Yes | Amount paid via this method |
| `payments[].reference` | string | No | External ref (e.g. ISO 20022 message ID) for reconciliation |

**Payment Methods Enum:**
- `cash` - Cash payment
- `card` - Credit/debit card
- `mobile` - Mobile payment (Apple Pay, Google Pay, TWINT, etc.)
- `voucher` - Gift card or voucher
- `invoice` - Pay later / invoice
- `crypto` - Cryptocurrency
- `other` - Other payment method

---

### 3.5 Items (Required)

```json
{
  "items": [
    {
      "line_number": 1,
      "description": "Organic Milk 1L",
      "quantity": 2,
      "unit": "piece",
      "unit_price": 2.50,
      "total_price": 5.00,
      "tax_rate": 2.6,
      "tax_category": "reduced",
      "discounts": [
        {
          "description": "Member discount",
          "amount": 0.50,
          "type": "fixed"
        }
      ],
      "identifiers": {
        "gtin": "7612345678901",
        "sku": "MILK-ORG-1L"
      },
      "product_info": {
        "brand": "Bio Suisse",
        "category": "Dairy",
        "category_code": "0401"
      }
    },
    {
      "line_number": 2,
      "description": "Whole Grain Bread 500g",
      "quantity": 1,
      "unit": "piece",
      "unit_price": 4.90,
      "total_price": 4.90,
      "tax_rate": 2.6,
      "tax_category": "reduced",
      "identifiers": {
        "gtin": "7612345678902"
      }
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `line_number` | integer | Yes | Sequential line number |
| `description` | string | Yes | Item description |
| `quantity` | decimal | Yes | Quantity purchased |
| `unit` | string | Yes | Unit of measure |
| `unit_price` | decimal | Yes | Price per unit (before line discounts) |
| `total_price` | decimal | Yes | Line total (after line discounts) |
| `tax_rate` | decimal | Yes | Applicable tax rate (%) |
| `tax_category` | enum | Yes | standard, reduced, zero, exempt |
| `discounts` | array | No | Line-level discounts |
| `identifiers.gtin` | string | **Recommended** | GS1 Global Trade Item Number (barcode) |
| `identifiers.sku` | string | No | Merchant's SKU |
| `product_info` | object | No | Additional product metadata |

**Units Enum (extensible):**
- `piece`, `kg`, `g`, `lb`, `oz`, `l`, `ml`, `m`, `cm`, `sqm`, `hour`

### 3.5.1 GTIN (Barcode) - Critical for Ecosystem Value

The **GTIN (Global Trade Item Number)** is the barcode number on products. Including GTIN is **strongly recommended** because it enables the entire ecosystem of value-added services:

```
GTIN enables:
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│  │  Product    │    │  Nutrition  │    │   Recall    │           │
│  │  Details    │    │    Info     │    │   Alerts    │           │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘           │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                     ┌──────┴──────┐                              │
│                     │    GTIN     │                              │
│                     │  (Barcode)  │                              │
│                     └──────┬──────┘                              │
│                            │                                     │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                  │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐           │
│  │  Warranty   │    │   Health    │    │   Carbon    │           │
│  │  Tracking   │    │    Apps     │    │  Footprint  │           │
│  └─────────────┘    └─────────────┘    └─────────────┘           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**GTIN Types:**
| Type | Digits | Usage |
|------|--------|-------|
| GTIN-8 | 8 | Small products |
| GTIN-12 | 12 | UPC (North America) |
| GTIN-13 | 13 | EAN (Europe, international) - **Most common** |
| GTIN-14 | 14 | Trade units, cases |

**Example GTIN-13:** `7612345678901`
- `761` = Switzerland country code
- `2345678` = Company code
- `901` = Product code
- Last digit = Check digit

**Data sources enabled by GTIN:**
| Service | Data Available |
|---------|----------------|
| **Open Food Facts** | Nutrition, ingredients, allergens, Nutri-Score |
| **GS1 Datahub** | Official product master data |
| **EU Safety Gate** | Product recall alerts |
| **Swiss BLV** | Food safety recalls (Switzerland) |
| **Open Beauty Facts** | Cosmetics ingredients |
| **Manufacturer APIs** | Warranty registration, manuals |
| **EU Digital Product Passport (DPP)** | Product identity link; DPP provides materials, carbon, recyclability (GTIN/GS1 Digital Link is the shared key). |

---

### 3.6 Taxes (Required)

```json
{
  "taxes": [
    {
      "tax_category": "reduced",
      "tax_rate": 2.6,
      "taxable_amount": 9.40,
      "tax_amount": 0.24
    },
    {
      "tax_category": "standard",
      "tax_rate": 8.1,
      "taxable_amount": 38.40,
      "tax_amount": 3.11
    },
    {
      "tax_category": "zero",
      "tax_rate": 0,
      "taxable_amount": 10.00,
      "tax_amount": 0,
      "exemption_reason": "Art. 148(a) Export"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tax_category` | enum | Yes | standard, reduced, zero, exempt |
| `tax_rate` | decimal | Yes | Tax rate percentage |
| `taxable_amount` | decimal | Yes | Amount subject to this tax rate |
| `tax_amount` | decimal | Yes | Calculated tax amount |
| `exemption_reason` | string | No | e.g. Art. 148(a) export, reverse charge |

---

### 3.7 Totals (Required)

```json
{
  "totals": {
    "subtotal": 47.80,
    "discount_total": 0.50,
    "tax_total": 3.35,
    "total": 50.65,
    "rounding": -0.05,
    "grand_total": 50.60,
    "amount_paid": 50.60,
    "amount_due": 0.00
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subtotal` | decimal | Yes | Sum of line totals before tax |
| `discount_total` | decimal | No | Total receipt-level discounts |
| `tax_total` | decimal | Yes | Sum of all taxes |
| `total` | decimal | Yes | Subtotal + tax - discounts |
| `rounding` | decimal | No | Cash rounding adjustment |
| `grand_total` | decimal | Yes | Final amount |
| `amount_paid` | decimal | Yes | Amount customer paid |
| `amount_due` | decimal | Yes | Remaining balance (0 for paid) |

---

## 4. Extensions (Optional Modules)

Extensions allow optional data without bloating the core spec.

### 4.1 Extension Namespace

```json
{
  "extensions": {
    "eq:warranty": { },
    "eq:b2b": { "customer_vat_id": "", "customer_address": { } },
    "eq:nutrition": { },
    "eq:carbon": { },
    "eq:dpp": { },
    "custom:mycompany": { }
  }
}
```

### 4.2 Warranty Extension

```json
{
  "extensions": {
    "eq:warranty": {
      "items": [
        {
          "line_number": 1,
          "warranty_months": 24,
          "warranty_type": "manufacturer",
          "warranty_expires": "2028-01-31",
          "warranty_url": "https://brand.com/warranty/register"
        }
      ]
    }
  }
}
```

### 4.3 Loyalty Extension

```json
{
  "extensions": {
    "eq:loyalty": {
      "program_name": "SuperPoints",
      "member_id_hash": "sha256:abc123...",
      "points_earned": 50,
      "points_redeemed": 0,
      "points_balance": 1250
    }
  }
}
```

### 4.4 Nutrition Extension

```json
{
  "extensions": {
    "eq:nutrition": {
      "items": [
        {
          "line_number": 1,
          "gtin": "7612345678901",
          "nutri_score": "A",
          "allergens": ["lactose"],
          "calories_per_100g": 64,
          "is_organic": true,
          "is_vegan": false
        }
      ]
    }
  }
}
```

### 4.5 EU Digital Product Passport (DPP) Extension

Optional link to EU DPP per item. Same product identifier (GTIN / GS1 Digital Link) links receipt line to DPP data.

```json
{
  "extensions": {
    "eq:dpp": {
      "items": [
        { "line_number": 1, "gtin": "7612345678901", "dpp_uri": "https://..." }
      ]
    }
  }
}
```

### 4.6 Carbon Footprint Extension

```json
{
  "extensions": {
    "eq:carbon": {
      "total_co2_kg": 2.4,
      "items": [
        {
          "line_number": 1,
          "co2_kg": 1.2,
          "source": "carboncloud.com"
        }
      ]
    }
  }
}
```

### 4.7 Product Recall Extension (Consumer Safety)

**Critical feature:** Automatically notify consumers when a purchased product is recalled.

```json
{
  "extensions": {
    "eq:recall": {
      "check_enabled": true,
      "last_checked": "2026-01-31T15:00:00+01:00",
      "items": [
        {
          "line_number": 1,
          "gtin": "7612345678901",
          "recall_status": "none",
          "checked_sources": ["eu_safety_gate", "ch_blv"]
        },
        {
          "line_number": 3,
          "gtin": "7698765432109",
          "recall_status": "recalled",
          "recall_info": {
            "recall_id": "A12/01onal/2026/0042",
            "source": "eu_safety_gate",
            "severity": "serious",
            "reason": "Choking hazard - small parts",
            "action": "Return to store for refund",
            "issued_date": "2026-01-28",
            "url": "https://ec.europa.eu/safety-gate-alerts/screen/webReport/..."
          }
        }
      ]
    }
  }
}
```

**Recall status values:**
| Status | Meaning |
|--------|---------|
| `none` | No recall found |
| `recalled` | Product has active recall |
| `watch` | Product under investigation |
| `unknown` | GTIN not found in databases |

**Consumer App Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT RECALL FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Consumer receives receipt with GTINs                        │
│                    │                                            │
│                    ▼                                            │
│  2. App periodically checks GTINs against recall databases      │
│     • EU Safety Gate API (non-food)                             │
│     • Swiss BLV (food, Switzerland)                             │
│     • RAPEX (EU rapid alert)                                    │
│     • Manufacturer recall feeds                                 │
│                    │                                            │
│                    ▼                                            │
│  3. If recall found:                                            │
│     ┌──────────────────────────────────────┐                     │
│     │ ⚠️ PUSH NOTIFICATION                 │                   │
│     │ "Product recall alert!"              │                    │
│     │ "Baby toy purchased 2026-01-15       │                    │
│     │ has been recalled due to             │                    │
│     │ choking hazard."                     │                    │
│     │ [View Details] [Return Instructions] │                    │
│     └──────────────────────────────────────┘                     │
│                    │                                            │
│                    ▼                                            │
│  4. Consumer can act immediately                                │
│     • View recall details                                       │
│     • Get return/refund instructions                            │
│     • Proof of purchase ready                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Recall Data Sources:**

| Source | Coverage | API Available |
|--------|----------|---------------|
| **EU Safety Gate** | EU non-food products | Yes (free) |
| **Swiss BLV** | Swiss food safety | Yes (opendata.swiss) |
| **FDA Recalls** | US food & drugs | Yes (free) |
| **CPSC** | US consumer products | Yes (free) |
| **Open Food Facts** | Community-sourced | Yes (free) |
| **GS1 Recall** | Brand-provided | Varies |

**Why GTIN is essential:** Without the barcode number, recall matching is impossible. This is why GTIN is "strongly recommended" in the items spec.

---

## 5. Signatures & Integrity (Optional)

For tamper-proof receipts (e.g., legal compliance):

```json
{
  "signatures": {
    "merchant_signature": {
      "algorithm": "RS256",
      "certificate_url": "https://merchant.com/.well-known/eq/cert.pem",
      "signature": "base64-encoded-signature"
    },
    "fiscal_signature": {
      "country": "AT",
      "device_id": "FISC-001",
      "signature": "base64-encoded-signature",
      "qr_code_data": "..."
    }
  }
}
```

---

## 6. Transport Mechanisms

### 6.1 Recommended Transport Methods

| Method | Use Case | Privacy Level |
|--------|----------|---------------|
| **QR Code** | Consumer scans at POS | High (no account needed) |
| **NFC** | Tap phone at terminal | High |
| **Email** | Traditional digital receipt | Medium |
| **API Push** | To consumer's app/bank | Medium |
| **API Pull** | Consumer fetches from merchant | Medium |
| **Bluetooth** | Proximity delivery | High |

**Security:** Consumer apps MUST verify the receipt signature regardless of transport. QR, NFC, API, email MUST be treated as untrusted; security comes from the receipt signature.

### 6.2 QR Code Payload (Standard)

QR contains **only** the reference and access token. App fetches receipt from merchant API.

**Payload (JSON):**
```json
{
  "eq": "1.0",
  "endpoint": "https://shop.example.ch/eq/v1",
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "<access-token>"
}
```

**Usage:** App calls `GET {endpoint}/receipts/{receipt_id}` with `Authorization: Bearer {token}` and displays the returned receipt. Embedded or multi-QR modes may be defined in future extensions.

### 6.3 API Endpoints (Recommendations)

**Merchant API (for receipt retrieval):**
```
GET  /eq/v1/receipts/{receipt-id}
     Accept: application/json
     Authorization: Bearer {consumer-token}
```
DPoP (RFC 9449) is RECOMMENDED for high-security use cases (e.g. luxury, electronics, B2B).

**Consumer App API (for receipt push):**
```
POST /eq/v1/inbox
     Content-Type: application/json
     Authorization: Bearer {app-token}
```

---

## 7. Privacy Considerations

### 7.1 Core Principle: No Customer Data

**eQ receipts contain ZERO customer information by design.**

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY BY DESIGN                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RECEIPT CONTAINS:              RECEIPT DOES NOT CONTAIN:       │
│  ✅ Merchant info               ❌ Customer name               │
│  ✅ Products purchased          ❌ Customer email              │
│  ✅ Prices and taxes            ❌ Customer phone              │
│  ✅ Date/time                   ❌ Customer address            │
│  ✅ Merchant signature          ❌ Customer ID                 │
│                                 ❌ Loyalty card number          │
│                                 ❌ Payment card number          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why:** The receipt is proof of transaction, not proof of identity. Keeping customer data separate protects privacy and simplifies GDPR compliance.

### 7.2 Token-Based Access

Consumers access their receipts via access tokens - like a coat check ticket:

```
Purchase Flow:
1. Customer pays (any method)
2. POS creates receipt (no customer data)
3. POS creates random access token
4. Customer receives token via QR/Airdrop/NFC
5. Customer uses token to retrieve receipt

Token ≠ Identity
Having the token = having the receipt
```

### 7.3 Consumer Choice at Payment

```
┌─────────────────────────────────────────┐
│  "Would you like a digital receipt?"    │
│                                         │
│  [QR Code]  [Airdrop]  [No thanks]      │
│                                         │
│  If "No thanks":                        │
│  • No token generated                   │
│  • No receipt stored for retrieval      │
│  • Optional: Paper receipt printed      │
└─────────────────────────────────────────┘
```

### 7.4 Sensitive Purchases

No special handling needed - privacy already protected. Since no customer data is on the receipt, there's no way to link any purchase to a person. A pharmacy receipt only proves "someone bought this item at this store."

### 7.5 GDPR Compliance

| GDPR Requirement | eQ Approach |
|------------------|---------------|
| Data minimization | No personal data collected |
| Purpose limitation | Receipt = transaction record only |
| Right to deletion | Consumer can discard token; no data to delete |
| Data portability | JSON format, standard schema |
| Privacy by design | ✅ Built into core specification |

---

## 8. Compliance Mapping

### 8.1 Regional Tax Requirements

| Country | Requirements | eQ Support |
|---------|--------------|--------------|
| **Switzerland** | UID, MwSt rates (8.1%, 2.6%, 0%) | ✅ tax_id_type, tax_rate |
| **Germany** | USt-IdNr, TSE signature | ✅ tax_id, signatures.fiscal |
| **Austria** | Registrierkassenpflicht | ✅ signatures.fiscal |
| **EU** | VAT rates vary by country | ✅ flexible tax_rate |

### 8.2 International Digital Record Compliance

eQ is designed to meet digital record-keeping requirements across all major jurisdictions. Most countries share similar core principles:

#### Universal Compliance Principles

| Principle | Requirement | eQ Implementation |
|-----------|-------------|---------------------|
| **Authenticity** | Prove who created the record | Merchant cryptographic signature |
| **Integrity** | Prove record hasn't been altered | Hash + signature verification |
| **Traceability** | Link records to transactions | Unique receipt ID, timestamps |
| **Completeness** | All required data present | JSON schema validation |
| **Accuracy** | Data is correct | Type checking, enum constraints |
| **Immutability** | Cannot be changed after creation | Cryptographic signatures |
| **Timeliness** | Created promptly | Timestamp required at issuance |
| **Accessibility** | Can be retrieved when needed | Standard API, archive support |
| **Machine-readable** | Can be processed automatically | Native JSON format |
| **Retention** | Kept for required period | Archive service support |

#### Jurisdiction-Specific Mapping

| Country | Regulation | Key Requirements | eQ Status |
|---------|------------|------------------|-------------|
| **Germany** | GoBD | Immutability, 10-year retention, audit trail | ✅ Compliant |
| **Switzerland** | OR Art. 957ff | Proper bookkeeping, traceability | ✅ Compliant |
| **Austria** | BAO, RKSV | Cash register security, signatures | ✅ Compliant |
| **France** | NF525 | Anti-fraud, immutability | ✅ Compliant |
| **Italy** | Agenzia delle Entrate | Electronic invoicing integration | ✅ Compatible |
| **EU General** | VAT Directive | Invoice requirements, VAT breakdown | ✅ Compliant |
| **UK** | Making Tax Digital | Digital records, software requirements | ✅ Compliant |
| **USA** | IRS Rev. Proc. | Legible, organized records | ✅ Compliant |

#### Why Digital-Born Records Are Accepted

Most modern tax authorities explicitly accept digital-born documents (like eQ) as equivalent or superior to scanned paper documents, because they:

1. **Cannot be altered** without detection (cryptographic signature)
2. **Are more complete** (structured data vs. image)
3. **Are more accessible** (searchable, API-retrievable)
4. **Have proven origin** (merchant signature verification)

> **Key principle:** If a jurisdiction accepts scanned paper receipts, it will accept eQ receipts - which provide stronger integrity guarantees than scanned images.

### 8.3 Alignment with E-Invoice Standards

| eQ Field | ZUGFeRD/Factur-X Equivalent |
|------------|----------------------------|
| `merchant.tax_id` | BT-31 Seller VAT identifier |
| `items[].gtin` | BT-157 Item standard identifier |
| `taxes[].tax_rate` | BT-152 Invoiced item VAT rate |
| `totals.grand_total` | BT-112 Invoice total with VAT |

### 8.4 Retention Model

| Period | Responsibility | Notes |
|--------|----------------|-------|
| 0-3 years | Merchant MUST serve receipts | Merchant API must be available |
| 3-10 years | Merchant SHOULD serve; User SHOULD backup | Migration to archive allowed |
| 10+ years | User responsibility | Archive service recommended |

---

## 9. Archive Service Interface

For long-term receipt storage when merchants close or for user backup.

### 9.1 Archive Service API

**Archive registration (merchant to archive):**
```
POST /eq/v1/archive/register
Content-Type: application/json
Authorization: Bearer {merchant-token}

{
  "merchant_domain": "oldshop.ch",
  "redirect_active": true,
  "receipts_count": 50000,
  "date_range": {
    "from": "2020-01-01",
    "to": "2026-01-31"
  }
}
```

**Receipt migration:**
```
POST /eq/v1/archive/receipts
Content-Type: application/json

{
  "receipts": [
    { /* full eQ receipt */ },
    { /* full eQ receipt */ }
  ]
}
```

**Receipt retrieval (consumer from archive):**
```
GET /eq/v1/archive/{original-merchant-domain}/receipts/{receipt-id}
Authorization: Bearer {consumer-token}
```

### 9.2 Redirect Flow

When merchant closes, domain can redirect to archive:

```
Original URL:
  https://oldshop.ch/eq/v1/receipts/xxx
  
Redirect (HTTP 301):
  → https://archive.eqstandard.org/oldshop.ch/receipts/xxx
  
Consumer tokens remain valid.
```

### 9.3 Archive Service Requirements

Archive services MUST:
- Maintain receipt integrity (verify signatures on import)
- Serve receipts via standard eQ API
- Support original access tokens
- Retain receipts for contracted period
- Provide data export on request

---

## 10. Free Hosted Service (Small Business Support)

For small businesses without technical resources, a free hosted service is recommended.

### 10.1 Concept: receipts.eqstandard.org

```
┌─────────────────────────────────────────────────────────────────┐
│              FREE HOSTED SERVICE FOR SMALL BUSINESS             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Merchant registers (free)                                   │
│     → Gets: myshop.receipts.eqstandard.org                      │
│                                                                 │
│  2. Uses web interface or mobile app                            │
│     → Enter sale details                                        │
│     → System generates eQ receipt + QR code                     │
│                                                                 │
│  3. Consumer scans QR                                           │
│     → Gets full eQ receipt from hosted service                  │
│                                                                 │
│  Cost: Free (funded by foundation/sponsors)                     │
│  Limits: X receipts/month on free tier                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Features

| Feature | Free Tier | Premium |
|---------|-----------|---------|
| Receipts/month | 500 | Unlimited |
| Retention | 3 years | 10 years |
| Custom domain | No | Yes |
| API access | Limited | Full |
| Support | Community | Email |

---

## 11. Example: Complete Receipt

```json
{
  "$schema": "https://eqstandard.org/schema/v1/receipt.json",
  "eq_version": "1.0.0",
  
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "sale",
    "receipt_number": "R-2026-00001234",
    "currency": "CHF",
    
    "merchant": {
      "name": "Bio Market",
      "tax_id": "CHE-123.456.789 MWST",
      "tax_id_type": "CH_MWST",
      "address": {
        "street": "Bahnhofstrasse 1",
        "city": "Zürich",
        "postal_code": "8001",
        "country": "CH"
      }
    },
    
    "transaction": {
      "transaction_id": "TXN-20260131-001234",
      "terminal_id": "POS-01",
      "payments": [
        {
          "method": "card",
          "amount": 12.30,
          "card_brand": "Visa",
          "card_last_four": "4242"
        }
      ]
    },
    
    "items": [
      {
        "line_number": 1,
        "description": "Bio Vollmilch 1L",
        "quantity": 2,
        "unit": "piece",
        "unit_price": 2.90,
        "total_price": 5.80,
        "tax_rate": 2.6,
        "tax_category": "reduced",
        "identifiers": {
          "gtin": "7612345678901"
        }
      },
      {
        "line_number": 2,
        "description": "Ruchbrot 500g",
        "quantity": 1,
        "unit": "piece",
        "unit_price": 4.50,
        "total_price": 4.50,
        "tax_rate": 2.6,
        "tax_category": "reduced",
        "identifiers": {
          "gtin": "7612345678902"
        }
      },
      {
        "line_number": 3,
        "description": "Espresso",
        "quantity": 1,
        "unit": "piece",
        "unit_price": 1.80,
        "total_price": 1.80,
        "tax_rate": 8.1,
        "tax_category": "standard"
      }
    ],
    
    "taxes": [
      {
        "tax_category": "reduced",
        "tax_rate": 2.6,
        "taxable_amount": 10.30,
        "tax_amount": 0.27
      },
      {
        "tax_category": "standard",
        "tax_rate": 8.1,
        "taxable_amount": 1.80,
        "tax_amount": 0.15
      }
    ],
    
    "totals": {
      "subtotal": 12.10,
      "tax_total": 0.42,
      "total": 12.52,
      "rounding": -0.02,
      "grand_total": 12.50,
      "amount_paid": 12.50,
      "amount_due": 0.00
    },
    
    "extensions": {
      "eq:warranty": {
        "items": []
      },
      "eq:nutrition": {
        "items": [
          {
            "line_number": 1,
            "nutri_score": "B",
            "is_organic": true
          }
        ]
      }
    }
  }
}
```

---

## 12. JSON Schema (Draft)

The formal JSON Schema will be published at:
```
https://eqstandard.org/schema/v1/receipt.json
```

Schema will include:
- Type validation for all fields
- Required field enforcement
- Enum constraints
- Format validation (UUID, ISO 8601, ISO 4217, etc.)
- Extension namespace validation

---

## 13. Error Handling

### 13.1 Malformed Receipts

Apps should be lenient when receiving receipts:

| Situation | Recommended Action |
|-----------|-------------------|
| Missing optional field | Proceed without it |
| Unknown extension | Ignore, continue processing |
| Invalid value in optional field | Log warning, use default |
| Invalid value in required field | Reject receipt, show error |
| Schema validation failure | Log details, notify merchant |

**Principle:** Be strict in what you produce, lenient in what you accept.

### 13.2 Unknown Extensions

When an app encounters an extension it doesn't understand:

```
1. Log the extension name
2. Ignore the extension data
3. Continue processing rest of receipt
4. Display warning to user: "Some receipt data not displayed"
```

### 13.3 Signature Verification Failure

Distinguish between network errors and actual invalid signatures:

```
Verification Flow:
┌─────────────────────────────────────────┐
│ 1. Check network connectivity           │
│    └── Offline? → "Cannot verify        │
│                    (offline)"           │
├─────────────────────────────────────────┤
│ 2. Fetch merchant certificate           │
│    └── Fetch fails? → "Cannot verify    │
│                        (network error)" │
├─────────────────────────────────────────┤
│ 3. Verify signature                     │
│    └── Invalid? → "⚠️ INVALID -         │
│                   may be forged"        │
├─────────────────────────────────────────┤
│ 4. Valid → "✅ Verified"                │
└─────────────────────────────────────────┘
```

### 13.4 Merchant API Down

Implement retry with exponential backoff:

```
Retry Policy:
  Attempt 1: Immediate
  Attempt 2: Wait 2 seconds
  Attempt 3: Wait 4 seconds
  Attempt 4: Wait 8 seconds
  Attempt 5: Wait 16 seconds
  Max attempts: 5
  
  Then: "Service temporarily unavailable. 
         Receipt saved, will retry later."
```

**Best practice:** Cache successful fetches locally to reduce dependency on merchant API.

### 13.5 Error Response Codes

Merchant APIs should return standard HTTP codes:

| Code | Meaning | Consumer Action |
|------|---------|-----------------|
| 200 | Success | Display receipt |
| 301 | Moved (archive) | Follow redirect |
| 401 | Invalid token | Token expired/invalid |
| 404 | Not found | Receipt doesn't exist or wrong ID |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Retry with backoff |
| 503 | Unavailable | Retry later |

---

## 14. Internationalization (i18n)

### 14.1 Character Encoding

All eQ data MUST be UTF-8 encoded. This supports:
- Latin scripts (Western European languages)
- Cyrillic scripts (Russian, etc.)
- RTL scripts (Arabic, Hebrew)
- CJK characters (Chinese, Japanese, Korean)
- Emojis

### 14.2 Locale-Dependent Display

Data is stored in neutral format; display depends on user's locale:

| Data | Storage Format | Example Display (by locale) |
|------|----------------|----------------------------|
| Numbers | `1234.56` | de-CH: `1'234.56` / de-DE: `1.234,56` |
| Dates | ISO 8601 | de-CH: `31.01.2026` / en-US: `01/31/2026` |
| Currency | `CHF` + `99.90` | de-CH: `CHF 99.90` / fr-CH: `99.90 CHF` |

### 14.3 Multi-Language Support

Product descriptions can include multiple languages:

```json
{
  "description": "Milk",
  "description_i18n": {
    "de": "Milch",
    "fr": "Lait",
    "it": "Latte",
    "en": "Milk"
  }
}
```

If `description_i18n` is present, apps should use the user's preferred language.

### 14.4 RTL Language Support

No special fields needed - UTF-8 handles directionality. Apps must:
- Detect text direction from language code
- Render appropriately (CSS `direction: rtl` etc.)

---

## 15. Versioning Strategy

### Semantic Versioning

`MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Breaking change to required fields | MAJOR | 1.0 → 2.0 |
| New optional fields/extensions | MINOR | 1.0 → 1.1 |
| Bug fixes, clarifications | PATCH | 1.0.0 → 1.0.1 |

### Backward Compatibility

- Consumers MUST accept unknown fields gracefully
- Producers SHOULD include `eq_version` 
- Major versions MAY run in parallel during transition

---

## 16. Implementation Checklist

### For POS Vendors

- [ ] Generate compliant JSON receipt
- [ ] Include required fields (metadata, merchant, transaction, items, taxes, totals)
- [ ] Provide transport mechanism (QR, API, email)
- [ ] Pass compliance test suite

### For Consumer Apps

- [ ] Parse eQ JSON
- [ ] Handle unknown extensions gracefully
- [ ] Display receipt to user
- [ ] Store securely with encryption

### For Accounting Software

- [ ] Import eQ receipts
- [ ] Map items to chart of accounts
- [ ] Extract tax information for VAT returns
- [ ] Support batch import

---

## Appendix A: EN 16931 Field Mapping

| eQ field | EN 16931 |
|----------|----------|
| receipt.id | — |
| receipt.issued_at | BT-2 |
| receipt.currency | BT-5 |
| receipt.invoice_number | BT-1 |
| receipt.supply_date | BT-72 |
| merchant.name | BT-27 |
| merchant.tax_id | BT-31 |
| merchant.address.line1 | BT-35 |
| merchant.address.line2 | BT-36 |
| merchant.address.city | BT-38 |
| merchant.address.postal_code | BT-39 |
| merchant.address.country | BT-40 |
| totals.subtotal | BT-109 |
| totals.grand_total | BT-112 |
| items[].line_number | BT-126 |
| items[].quantity | BT-129 |
| items[].unit_price | BT-146 |
| items[].total_price | BT-131 |
| taxes[].tax_rate | BT-151 |
| taxes[].tax_amount | BT-152 |

---

## Appendix B: Future / Roadmap

- **Merchant identity:** Optional `did:web` support (v1.1).
- **Selective disclosure:** SD-JWT (RFC 9901) for privacy-preserving receipt sharing (v1.1+).

---

*This specification is a living document. Feedback welcome via GitHub issues.*
