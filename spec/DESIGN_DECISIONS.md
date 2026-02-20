# eQ - electronic Quittung
## Design Decisions Log

**Project Name:** eQ (electronic Quittung)  
**Website:** eqstandard.org

**Document Status:** Working Document  
**Date:** 2026-02-20  
**Purpose:** Record key design decisions and their rationale

---

## Core Philosophy

### Privacy by Default

**Decision:** No customer data is stored in or linked to the receipt.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY MODEL                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RECEIPT contains:              RECEIPT does NOT contain:       │
│  ✅ Merchant info               ❌ Customer name               │
│  ✅ Products purchased          ❌ Customer email              │
│  ✅ Prices, taxes               ❌ Customer address            │
│  ✅ Date/time                   ❌ Customer ID                 │
│  ✅ Signatures                  ❌ Payment card details        │
│                                 ❌ Loyalty card ID             │
│                                                                 │
│  Customer receives: ACCESS TOKEN (like a claim ticket)          │
│  Token allows retrieval but doesn't identify the person         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale:** 
- Receipt is proof of transaction, not proof of identity
- Consumer privacy protected by default
- No GDPR issues - no personal data to protect
- Consumer chooses when/if to link receipt to their systems

---

## 0. Data Format Choice

### 0.1 JSON vs TOON Analysis

**Decision:** Use JSON as the primary data format.

**Date:** 2026-02-02

**Alternatives Considered:**

| Format | Description |
|--------|-------------|
| **JSON** | JavaScript Object Notation - universal data interchange format |
| **TOON** | Token-Oriented Object Notation - compact format designed for LLM prompts (30-60% fewer tokens) |
| **XML** | Extensible Markup Language - legacy enterprise format |
| **TOML** | Tom's Obvious Minimal Language - configuration file format |

### 0.2 Why Not TOON?

[TOON](https://github.com/toon-format/toon) (Token-Oriented Object Notation) is a promising new format that reduces tokens by 30-60% compared to JSON. However, it is **not suitable** for eQ because:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOON vs JSON for eQ                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TOON is designed for:          eQ requires:                    │
│  • LLM input optimization       • System-to-system interchange  │
│  • Reducing API token costs     • Cryptographic signatures      │
│  • AI prompt efficiency         • Schema validation             │
│  • Tabular/uniform data         • Nested structures             │
│                                                                 │
│  ❌ Mismatch: TOON solves a different problem than eQ needs    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Detailed comparison:**

| Criterion | JSON | TOON | Winner for eQ |
|-----------|------|------|---------------|
| **Primary use case** | Data interchange | LLM input | **JSON** |
| **Schema validation** | JSON Schema (mature) | None standardized | **JSON** |
| **Cryptographic signatures** | JCS standard exists | No canonical form | **JSON** |
| **Web/API native** | Universal support | Requires libraries | **JSON** |
| **Tooling ecosystem** | Every language | Growing (TS, Python, Rust) | **JSON** |
| **Nested structures** | Efficient | Loses advantage | **JSON** |
| **Spec stability** | Stable | v3.0 working draft | **JSON** |
| **Token efficiency** | Baseline | 30-60% reduction | TOON |
| **LLM accuracy** | 70% benchmark | 74% benchmark | TOON |

**Key reasons for JSON:**

1. **eQ is data interchange, not LLM input** - TOON explicitly states it's "intended for *LLM input* as a drop-in representation of your existing JSON"

2. **Cryptographic signatures require canonical serialization** - JSON has JCS (JSON Canonicalization Scheme, RFC 8785); TOON has no equivalent

3. **Schema validation is critical** - Receipt compliance across jurisdictions requires robust validation; JSON Schema is mature and universal

4. **eQ has nested structures** - Merchant objects, transaction objects, extensions are nested; TOON benchmarks show it performs worse than compact JSON for nested data

5. **TOON spec is evolving** - Currently v3.0 "working draft"; a 10+ year standard needs stable foundations

### 0.3 Future Consideration: TOON as Secondary Format

If AI processing of receipts becomes important, a future extension could support TOON as an **optional output format**:

```
GET /eq/v1/receipts/{id}
Accept: application/json      → Returns JSON (default, canonical)
Accept: text/toon             → Returns TOON (for AI pipelines)
```

This would allow:
- JSON remains the authoritative format (signatures, validation)
- TOON provided as convenience for AI/LLM use cases
- No impact on core specification

**Status:** Not planned for v1.0. May revisit when TOON specification stabilizes.

### 0.4 Address, Signature, QR, Transport (2026-02)

**Address:** One interchange structure (line1, line2, city, postal_code, subdivision, country). Optional `address_standard` (EN16931 | ISO20022 | local) as hint; content may follow any of these. No second schema.

**Signature:** Receipt and signature in the same JSON document. JCS (RFC 8785) + JWS detached (RFC 7515); signature over full receipt. Any modification invalidates the signature.

**QR:** Single payload only: endpoint, receipt_id, token, optional issued_at. App fetches receipt via API. No embedded receipt or multi-QR in v1.0.

**Transport:** All channels (QR, NFC, API, email) are untrusted. Consumer apps MUST verify receipt signature regardless of transport.

### 0.5 Detailed Alternative Analysis

#### 0.5.1 XML with XSD

XML (Extensible Markup Language) with XSD (XML Schema Definition) was seriously considered due to its maturity in enterprise and government systems.

**XML + XSD Advantages:**

| Advantage | Description |
|-----------|-------------|
| **Mature schema validation** | XSD is ISO standardized (ISO/IEC 19757), battle-tested for 20+ years |
| **Enterprise adoption** | Widely used in banking, government, healthcare (HL7, SWIFT, etc.) |
| **E-invoice alignment** | ZUGFeRD/Factur-X and UBL use XML; easier B2B integration |
| **Transformation tools** | XSLT enables powerful transformations between formats |
| **Namespaces** | Native support for mixing schemas and extensions |
| **Document signing** | XML-DSig (W3C) is a mature standard for digital signatures |
| **Attributes vs elements** | Can express metadata separately from content |

**XML + XSD Disadvantages:**

| Disadvantage | Impact on eQ |
|--------------|--------------|
| **Verbose syntax** | 30-50% larger payloads than JSON |
| **QR code inefficiency** | Larger size = harder to fit in QR codes |
| **Web ecosystem decline** | Modern APIs (REST, GraphQL) use JSON; XML tooling declining |
| **Parsing complexity** | DOM/SAX parsers more complex than JSON.parse() |
| **JavaScript friction** | Not native; requires libraries and conversion |
| **Developer experience** | Younger developers less familiar with XML |
| **Mobile overhead** | Heavier parsing on resource-constrained devices |

**Payload size comparison (same receipt):**

```xml
<!-- XML: 847 bytes -->
<?xml version="1.0" encoding="UTF-8"?>
<receipt xmlns="https://eqstandard.org/schema/v1">
  <metadata>
    <id>550e8400-e29b-41d4-a716-446655440000</id>
    <issuedAt>2026-01-31T14:30:00+01:00</issuedAt>
    <currency>CHF</currency>
  </metadata>
  <merchant>
    <name>Bio Market</name>
    <taxId>CHE-123.456.789</taxId>
  </merchant>
  <items>
    <item lineNumber="1">
      <description>Organic Milk 1L</description>
      <quantity>2</quantity>
      <unitPrice>2.90</unitPrice>
      <totalPrice>5.80</totalPrice>
    </item>
  </items>
  <totals>
    <grandTotal>5.80</grandTotal>
  </totals>
</receipt>
```

```json
// JSON: 456 bytes (46% smaller)
{
  "eq_version": "1.0.0",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "currency": "CHF",
    "merchant": {
      "name": "Bio Market",
      "tax_id": "CHE-123.456.789"
    },
    "items": [{
      "line_number": 1,
      "description": "Organic Milk 1L",
      "quantity": 2,
      "unit_price": 2.90,
      "total_price": 5.80
    }],
    "totals": { "grand_total": 5.80 }
  }
}
```

**Decision rationale:**

XML was rejected primarily because:

1. **Consumer-facing standard** - eQ targets consumers with smartphone apps, not just enterprise B2B; JSON is native to this ecosystem
2. **QR code transport** - Smaller payloads critical for offline/QR use cases
3. **Developer adoption** - JSON lowers barrier for implementers, accelerating ecosystem growth
4. **Modern tooling** - JSON Schema validation is sufficient and better integrated with modern development workflows

**Mitigation:** The specification includes guidance for XML transformation for systems requiring it (e.g., legacy ERP integration via XSLT).

---

#### 0.5.2 YAML

YAML (YAML Ain't Markup Language) was considered for its human readability.

**YAML Advantages:**

| Advantage | Description |
|-----------|-------------|
| **Human readable** | Clean syntax, no quotes for most strings |
| **Comments** | Native comment support |
| **JSON superset** | Valid JSON is valid YAML |
| **Configuration standard** | Popular for config files (Docker, Kubernetes, CI/CD) |

**YAML Disadvantages:**

| Disadvantage | Impact on eQ |
|--------------|--------------|
| **Parsing ambiguities** | `no` becomes boolean `false`; `1.2.3` can be misinterpreted |
| **Security concerns** | Arbitrary code execution in some parsers (YAML deserialization attacks) |
| **Whitespace sensitivity** | Indentation errors cause silent failures |
| **No native web support** | Requires libraries in browsers |
| **Multiple specs** | YAML 1.1 vs 1.2 have different behaviors |
| **Schema validation** | No equivalent to JSON Schema maturity |

**The "Norway Problem":**

```yaml
# YAML 1.1 interprets this incorrectly:
country: NO        # Parsed as boolean false, not string "NO"
version: 1.0       # Parsed as float 1.0, not string "1.0"
date: 2026-01-31   # Parsed as date object, not string

# JSON is unambiguous:
{ "country": "NO", "version": "1.0", "date": "2026-01-31" }
```

**Decision rationale:** YAML's parsing ambiguities and security concerns make it unsuitable for a financial/legal document format where precision is critical.

---

#### 0.5.3 TOML

TOML (Tom's Obvious Minimal Language) was considered briefly.

**TOML Advantages:**

| Advantage | Description |
|-----------|-------------|
| **Human readable** | Very clean syntax |
| **Unambiguous** | No YAML-style parsing surprises |
| **Native date/time** | First-class datetime support |
| **Comments** | Native comment support |

**TOML Disadvantages:**

| Disadvantage | Impact on eQ |
|--------------|--------------|
| **Designed for config** | Not intended for data interchange |
| **Arrays of tables awkward** | Receipt line items would be clunky |
| **No schema validation** | No equivalent to JSON Schema |
| **Limited tooling** | Far fewer libraries than JSON |
| **No web support** | Not native to browsers |
| **Flat structure bias** | Nested objects less natural |

**Example (awkward for receipts):**

```toml
# TOML: Arrays of tables are verbose for receipt items
[receipt]
id = "550e8400-e29b-41d4-a716-446655440000"
issued_at = 2026-01-31T14:30:00+01:00
currency = "CHF"

[receipt.merchant]
name = "Bio Market"
tax_id = "CHE-123.456.789"

[[receipt.items]]
line_number = 1
description = "Organic Milk 1L"
quantity = 2
unit_price = 2.90
total_price = 5.80

[[receipt.items]]
line_number = 2
description = "Bread"
quantity = 1
unit_price = 4.50
total_price = 4.50
```

**Decision rationale:** TOML is excellent for configuration files (Cargo.toml, pyproject.toml) but not designed for structured data interchange.

---

#### 0.5.4 Protocol Buffers / Binary Formats

Binary formats like Protocol Buffers (protobuf), MessagePack, CBOR, and Avro were considered for efficiency.

**Binary Format Advantages:**

| Advantage | Description |
|-----------|-------------|
| **Compact size** | 50-80% smaller than JSON |
| **Fast parsing** | Binary parsing faster than text |
| **Strong typing** | Schema-enforced types |
| **Bandwidth efficient** | Ideal for high-volume APIs |

**Binary Format Disadvantages:**

| Disadvantage | Impact on eQ |
|--------------|--------------|
| **Not human readable** | Cannot debug by inspection |
| **Schema required** | Must have schema to decode |
| **QR code incompatible** | Binary doesn't fit QR alphanumeric mode |
| **Tooling barrier** | Requires special tools to inspect |
| **Versioning complexity** | Schema evolution more complex |
| **Consumer unfriendly** | End users can't read their receipts |

**Decision rationale:** Human readability is a core design principle. Consumers and developers should be able to inspect receipts directly. Binary formats would also complicate QR code transport.

---

#### 0.5.5 CSV

CSV (Comma-Separated Values) was considered for line items due to its simplicity.

**CSV Advantages:**

| Advantage | Description |
|-----------|-------------|
| **Simple** | Universal, minimal syntax |
| **Compact** | Very efficient for tabular data |
| **Spreadsheet compatible** | Opens directly in Excel |

**CSV Disadvantages:**

| Disadvantage | Impact on eQ |
|--------------|--------------|
| **Flat only** | Cannot represent nested structures (merchant, transaction) |
| **No types** | Everything is a string |
| **No schema** | No validation mechanism |
| **Escaping issues** | Commas in descriptions cause problems |
| **No metadata** | Cannot include receipt-level fields |

**Decision rationale:** Receipts require nested structures (merchant info, transaction details, items, taxes, extensions). CSV cannot represent this without lossy flattening.

---

### 0.6 Format Decision Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    FORMAT EVALUATION MATRIX                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Criteria weights for eQ:                                       │
│  ████████████ Schema validation (critical)                      │
│  ████████████ Cryptographic signatures (critical)               │
│  ██████████░░ Web/API compatibility (high)                      │
│  ██████████░░ QR code transport (high)                          │
│  ████████░░░░ Human readability (medium)                        │
│  ██████░░░░░░ Payload size (medium)                             │
│  ████░░░░░░░░ Enterprise adoption (low for v1)                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Results:                                                       │
│                                                                 │
│  JSON   ████████████████████  Best overall fit                  │
│  XML    ██████████████░░░░░░  Good for enterprise; too verbose  │
│  YAML   ████████████░░░░░░░░  Parsing concerns; no schema       │
│  TOON   ██████████░░░░░░░░░░  Wrong use case (LLM, not data)    │
│  TOML   ████████░░░░░░░░░░░░  Config format, not data           │
│  Binary ██████░░░░░░░░░░░░░░  Not human readable                │
│  CSV    ████░░░░░░░░░░░░░░░░  Cannot represent structure        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Final decision:** JSON with JSON Schema validation

**Key factors:**
1. Universal web/API ecosystem support
2. JSON Schema provides robust validation
3. JCS (RFC 8785) enables cryptographic signatures
4. Compact enough for QR code transport (with gzip)
5. Human readable for debugging and transparency
6. Lowest barrier to adoption for implementers

**Compatibility provisions:**
- XML transformation guidance for legacy systems
- Future TOON output for AI use cases (when stable)

---

## 1. Technical Edge Cases

### 1.1 Offline Support

**Decision:** Printed QR code or Airdrop/Bluetooth transfer

**Implementation:**
- Primary: QR code printed on paper or displayed on screen
- Secondary: Airdrop (iOS), Nearby Share (Android), Bluetooth
- QR code contains only the retrieval token (endpoint, receipt_id, access token)
- Consumer app fetches the full receipt via API when internet is available
- The QR scan itself works offline (token is stored locally until connectivity returns)

```
Consumer at checkout:
┌─────────────────────────────────────────────────────────────────┐
│  "Would you like your receipt?"                                 │
│                                                                 │
│  [Paper]  [QR Code]  [Airdrop]  [No thanks]                     │
│                                                                 │
│  If QR Code selected:                                           │
│  ┌─────────┐                                                    │
│  │ ▄▄▄▄▄▄▄ │  ← Consumer scans with any app                     │
│  │ █ ▀▀▀ █ │     No account needed                              │
│  │ ▀▀▀▀▀▀▀ │     No identification required                     │
│  └─────────┘     Token stored; receipt fetched when online       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Receipt Size Limits

**Decision:** QR code contains only a retrieval token. No embedded receipt or multi-QR in v1.0.

| Approach | Description |
|----------|-------------|
| **Token-only QR** | QR encodes endpoint + receipt_id + access token. Consumer app fetches receipt via API. |

**QR Payload (JSON):**
```json
{
  "eq": "1.0",
  "endpoint": "https://shop.example.ch/eq/v1",
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "<access-token>",
  "issued_at": "2026-01-31T14:30:00+01:00"
}
```

Receipt size is irrelevant for the QR code since it only carries the token. The full receipt lives on the merchant's API.

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

**Decision:** Merchant serves receipts while active. Consumer stores locally upon first fetch. Long-term retention is the consumer's responsibility.

| Aspect | Responsibility |
|--------|----------------|
| **Serving** | Merchant hosts receipt at API endpoint while merchant is active |
| **First fetch** | Consumer app fetches and stores receipt locally upon first retrieval |
| **Long-term** | Consumer's responsibility; local copy is the authoritative record after fetch |
| **Offline access** | Consumer app provides access from local storage at any time |

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
│                    TOKEN-BASED ACCESS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Customer pays (any method: cash, card, etc.)                │
│                                                                 │
│  2. POS generates:                                              │
│     • Receipt (no customer data)                                │
│     • Access token (random, not linked to identity)             │
│                                                                 │
│  3. Customer receives token via:                                │
│     • QR code (printed or on screen)                            │
│     • Airdrop/Bluetooth                                         │
│     • NFC tap                                                   │
│                                                                 │
│  4. Customer can:                                               │
│     • Import to personal finance app                            │
│     • Import to accounting software                             │
│     • Store in warranty tracker                                 │
│     • Ignore/discard                                            │
│                                                                 │
│  TOKEN ≠ IDENTITY                                               │
│  Having the token = having the receipt (like a coat check)      │
│                                                                 │
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
- Retention support ✅ (consumer local storage + archive service)
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
| Switzerland | 10 years (business) | Consumer stores locally; archive service for backup |
| Germany | 10 years (business) | Consumer stores locally; archive service for backup |
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

- No conflict between systems
- Consumer choice respected at checkout

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
3. **User responsibility** - Consumer stores receipts locally after fetch
4. **Graceful degradation** - Handle errors without crashing
5. **Algorithm agility** - Future-proof crypto
6. **Offline-first** - QR codes work without internet
7. **Locale-aware** - Store neutral, display per locale
8. **No certification bureaucracy** - Self-certify with test suite

---

*This document records design decisions. Final specifications are in SPECIFICATION.md*
