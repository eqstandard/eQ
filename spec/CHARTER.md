# eQ - electronic Quittung
## Project Charter v0.1

**Project Name:** eQ (electronic Quittung)  
**Website:** eqstandard.org

**Document Status:** Draft  
**Date:** 2026-02-20  
**License:** CC-BY-4.0 (this document), Community Specification 1.0 (specification)

---

## What is eQ?

**eQ** stands for **electronic Quittung** (German: "electronic receipt").

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│     ███████╗ ██████╗                                            │
│     ██╔════╝██╔═══██╗   electronic Quittung                     │
│     █████╗  ██║   ██║   The open standard for digital receipts  │
│     ██╔══╝  ██║▄▄ ██║                                           │
│     ███████╗╚██████╔╝   eqstandard.org                          │
│     ╚══════╝ ╚══▀▀═╝                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**eQ** is a truly open, royalty-free standard for digital receipts that:
- Works across all countries and currencies
- Contains no customer personal data (privacy by design)
- Is cryptographically signed (forgery-proof)
- Enables an ecosystem of apps and services

---

## 1. Project Vision

### Mission Statement

To create a **truly open, royalty-free, vendor-neutral standard** for digital receipts that enables:
- Seamless data flow between point-of-sale systems, consumers, and downstream applications
- Consumer ownership and portability of their purchase data
- Innovation through an open ecosystem of services built on standardized receipt data

### Core Principles

| Principle | Commitment |
|-----------|------------|
| **Royalty-Free** | No patents, no licensing fees to implement the standard |
| **Free to Read** | Specification publicly available without membership or registration |
| **Free to Implement** | Anyone can build compatible software without permission |
| **Open Governance** | All decisions made transparently; meeting notes public |
| **Vendor-Neutral** | No single company controls the standard |
| **Privacy-First** | Consumer data sovereignty is a core design principle |
| **Decentralized** | Receipt data stays with merchants; no central database |
| **Forgery-Proof** | Cryptographic signatures ensure authenticity |

---

## 2. Problem Statement

### Current State

The digital receipt landscape is fragmented:

- **30+ proprietary solutions** exist, each with incompatible data formats
- Most solutions become **data silos** ("endpoints") that cannot interoperate
- Consumers cannot easily **port their purchase data** between services
- Businesses spend significant resources on **AI/OCR to extract data** from paper receipts or PDFs
- Existing "standards" (GS1, SDRS) are controlled by **industry consortiums with commercial interests**
- **4 billion paper receipts** printed annually in Sweden alone (similar scale across Europe)

### Consequences

- **For Consumers:** Lost receipts, no warranty tracking, manual expense entry, no dietary/health insights
- **For Businesses:** High integration costs, duplicate data entry, expensive OCR processing
- **For Innovation:** Valuable services cannot be built without access to standardized data
- **For Environment:** Millions of trees consumed, toxic bisphenol exposure from thermal paper

---

## 3. Scope

### In Scope

| Category | Description |
|----------|-------------|
| **Core Specification** | JSON Schema defining the receipt data model |
| **Decentralized Architecture** | Merchant-hosted data with token-based consumer access |
| **Security Framework** | Cryptographic signatures, forgery protection, crawler prevention |
| **Product Identifiers** | GTIN (barcode) integration for linking to product databases |
| **Product Recall Extension** | Integration with EU Safety Gate, Swiss BLV for consumer alerts |
| **Transport Layer** | Recommended methods for receipt transmission (API, QR code, NFC) |
| **Privacy Framework** | Guidelines for consent, data minimization, retention |
| **Internationalization** | Multi-currency, multi-language, regional tax compliance |
| **Reference Implementation** | Open source libraries for common platforms |
| **Compliance Test Suite** | Tools to verify standard conformance |

### Out of Scope (Phase 1)

- Payment processing
- Loyalty programs (may be addressed in future extensions)
- Invoice standards (coordinate with, don't replace ZUGFeRD/Factur-X)
- Regulatory lobbying

---

## 4. Use Cases

### Primary Use Cases

#### UC1: Paperless Receipts
> As a **consumer**, I want to receive my receipt digitally after purchase, so that I don't need to keep paper receipts.

#### UC2: Automatic Bookkeeping Integration
> As a **business owner**, I want my purchase receipts to flow directly into my accounting software with full line-item detail, so that I don't need to manually enter data or scan paper.

#### UC3: AI Token Savings
> As a **software developer**, I want structured receipt data instead of images/PDFs, so that I don't waste AI tokens on OCR extraction.

#### UC4: Warranty Management
> As a **consumer**, I want an app to automatically track my purchases and warranty periods, so that I never lose a warranty claim due to a lost receipt.

#### UC5: Health & Dietary Tracking
> As a **health-conscious consumer**, I want an app to analyze my grocery purchases against my allergies and dietary preferences, so that I can make healthier choices.

#### UC6: Expense Reporting
> As an **employee**, I want my business purchases to automatically populate expense reports with correct categories and VAT, so that I can submit expenses in minutes instead of hours.

#### UC7: Product Recalls
> As a **consumer**, I want to be automatically notified if a product I purchased is recalled, so that I can protect my family's safety.

#### UC8: Tax Refunds (Cross-Border)
> As a **tourist**, I want automated VAT refund processing based on my digital receipts, so that I don't need to queue at border customs.

#### UC9: Proof of Purchase (Forgery-Proof)
> As a **consumer**, I want a cryptographically signed receipt that proves I made a purchase, so that I can make warranty claims or returns even years later without doubt of authenticity.

#### UC10: Data Sovereignty (Decentralized)
> As a **consumer**, I want my receipt data to stay with the merchant (not a central database), so that no single company can see all my purchases and I retain control over who accesses my data.

#### UC11: Vendor Verification (Anti-Fraud)
> As a **merchant**, I want receipts to be cryptographically bound to my identity, so that no one can forge a fake receipt claiming to have purchased from my store and fraudulently claim warranty or refunds.

#### UC12: Warranty Claim Validation
> As a **warranty service provider**, I want to verify that a receipt was genuinely issued by the claimed merchant, so that I don't process fraudulent warranty claims based on forged receipts.

#### UC13: Insurance Claims (Theft/Damage Documentation)
> As a **consumer**, I want to quickly find and share authentic receipts with my insurance company after theft or damage, so that I can prove ownership and purchase value for faster claim processing.

### Secondary Use Cases (Future Phases)

- Second-hand marketplace proof of purchase (with verifiable receipt transfer)
- Carbon footprint tracking
- Price comparison and savings analysis

---

## 5. Governance Structure

### Proposed Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Steering Committee                        │
│  • Sets strategic direction and priorities                  │
│  • Approves major specification changes                     │
│  • Resolves disputes                                        │
│  • 5-7 members, elected by contributors                     │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Core Spec   │    │    Privacy    │    │ Implementers  │
│ Working Group │    │ Working Group │    │ Working Group │
│               │    │               │    │               │
│ • Data model  │    │ • Consent     │    │ • Libraries   │
│ • Schema      │    │ • Retention   │    │ • Test suite  │
│ • Extensions  │    │ • Compliance  │    │ • Integration │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
┌───────────────────────┐              ┌───────────────────────┐
│  Community Contributors│              │   Adopter Companies    │
│  (Anyone can join)     │              │   (Implement standard) │
└───────────────────────┘              └───────────────────────┘
```

### Decision Making

| Decision Type | Process |
|---------------|---------|
| **Minor changes** | Pull request + 2 approvals from Working Group |
| **Spec changes** | Working Group consensus + 14-day public comment |
| **Major changes** | Steering Committee vote (2/3 majority) |
| **Breaking changes** | Steering Committee + 30-day public comment + major version bump |

### Meetings

- **Steering Committee:** Monthly, public agenda, published minutes
- **Working Groups:** Bi-weekly, open to all contributors
- **All-Hands:** Quarterly, open community call

---

## 6. Intellectual Property

### Licensing

| Asset | License |
|-------|---------|
| **Specification** | Community Specification 1.0 (patent protection, royalty-free) |
| **Documentation** | CC-BY-4.0 |
| **Reference Code** | Apache 2.0 or MIT |
| **Logos/Branding** | Trademark policy TBD |

### Contributor Agreement

All contributors must agree to:
1. License contributions under the project's chosen license
2. Confirm they have the right to make contributions
3. Grant patent license for any patents reading on their contributions

---

## 7. Success Metrics

### Phase 1 (Foundation) - Target: 6 months

- [ ] Specification v1.0 published
- [ ] Reference implementation in 2+ languages
- [ ] 3+ early adopters committed
- [ ] Compliance test suite available
- [ ] Website and documentation live

### Phase 2 (Adoption) - Target: 18 months

- [ ] 10+ POS systems support eQ
- [ ] 5+ accounting software integrations
- [ ] 3+ consumer apps using eQ
- [ ] 1+ banking/fintech integration
- [ ] 100+ GitHub stars / community contributors

### Phase 3 (Scale) - Target: 36 months

- [ ] Major retailer adoption (1+ chain with 100+ stores)
- [ ] Government/regulatory recognition
- [ ] ISO standardization pathway initiated
- [ ] 1 million+ receipts processed monthly

---

## 8. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GS1/SDRS become dominant | Medium | High | Move fast, focus on truly open; differentiate on openness |
| Lack of POS vendor adoption | High | High | Start with open source POS; build compelling value |
| Privacy concerns deter consumers | Medium | High | Privacy-first design; work with advocacy groups |
| Fragmentation / competing forks | Low | Medium | Strong governance; responsive to community |
| Resource constraints | High | Medium | Start small; seek foundation sponsorship |

---

## 9. Timeline

### Phase 1: Foundation (Months 1-6)

| Month | Milestone |
|-------|-----------|
| 1 | Charter finalized, GitHub repository live, initial contributors |
| 2 | Core data model draft, community feedback |
| 3 | Schema v0.9, reference implementation started |
| 4 | Public review period, test suite development |
| 5 | Incorporate feedback, v1.0 release candidate |
| 6 | **Specification v1.0 release** |

### Phase 2: Adoption (Months 7-18)

- Outreach to POS vendors and accounting software
- Consumer app partnerships
- Conference presentations
- Case studies from early adopters

### Phase 3: Scale (Months 19-36)

- Enterprise adoption
- Regulatory engagement
- ISO standardization consideration
- Sustainability (foundation funding model)

---

## 10. How to Participate

### Contributor Roles

| Role | Description | Time Commitment |
|------|-------------|-----------------|
| **Observer** | Follow discussions, provide feedback | As desired |
| **Contributor** | Submit PRs, participate in reviews | 2-4 hours/month |
| **Working Group Member** | Regular participation in WG meetings | 4-8 hours/month |
| **Maintainer** | Merge PRs, guide technical direction | 8+ hours/month |
| **Steering Committee** | Strategic decisions, governance | 4-6 hours/month |

### Getting Started

1. **Star & Watch** the GitHub repository
2. **Join** the community chat (Discord/Matrix TBD)
3. **Read** the specification draft
4. **Comment** on open issues or create new ones
5. **Submit** pull requests with improvements

---

## 11. Contact

**Project Lead:** Martin Koch  
**Email:** team@eqstandard.org  
**GitHub:** https://github.com/eqstandard/eQ
**Website:** https://eqstandard.org/

---

## Appendix A: Relationship to Existing Standards

| Standard | Relationship |
|----------|--------------|
| **EN 16931** | Align data model; field mapping in spec Appendix A |
| **ZUGFeRD / Factur-X** | B2B invoice compatibility (EN 16931-based) |
| **OMG DRAPI** | Learn from; differentiate on decentralization, privacy |
| **fiskaltrust** | Implementation partner for DACH fiscal (TSE/RKSV) |
| **EU Digital Product Passport** | v1.0 extension (eq:dpp), product/sustainability |
| **SDRS** | Learn from; potentially compatible extension |
| **GS1 Digital Link** | Product identification; recommend GTINs where available |
| **JSON Schema** | Validation |
| **ISO 8601, 4217, 3166** | Date, currency, country codes |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **eQ** | Open Digital Receipt Standard (this project) |
| **POS** | Point of Sale |
| **GTIN** | Global Trade Item Number (product identifier) |
| **VAT** | Value Added Tax |
| **OCR** | Optical Character Recognition |

---

*This charter is a living document and will evolve based on community input.*
