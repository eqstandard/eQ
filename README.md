<p align="center">
  <h1 align="center">eQ - electronic Quittung</h1>
  <p align="center">
    <strong>The open standard for digital receipts</strong>
  </p>
  <p align="center">
    <a href="https://eqstandard.org">Website</a> •
    <a href="/spec/SPECIFICATION.md">Specification</a> •
    <a href="/spec/CHARTER.md">Charter</a> •
    <a href="https://github.com/eqstandard/eQ/discussions">Discussions</a>
  </p>
</p>

---

## What is eQ?

**eQ** (electronic Quittung) is a truly open, royalty-free standard for digital receipts.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Purchase at store                                              │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────┐     Consumer scans QR                              │
│  │ ▄▄▄▄▄▄▄ │     or receives via Airdrop                        │
│  │ █ eQ  █ │ ──────────────────────────────┐                    │
│  │ ▀▀▀▀▀▀▀ │                               │                    │
│  └─────────┘                               ▼                    │
│                              ┌──────────────────────┐           │
│                              │   Consumer's App     │           │
│                              │  ┌────────────────┐  │           │
│                              │  │ Warranty Track │  │           │
│                              │  │ Expense Report │  │           │
│                              │  │ Health Monitor │  │           │
│                              │  │ Bookkeeping    │  │           │
│                              │  └────────────────┘  │           │
│                              └──────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

| Feature | Description |
|---------|-------------|
| 🔓 **Truly Open** | No patents, no licensing fees, free to implement |
| 🔒 **Privacy by Design** | No customer data in receipts |
| ✍️ **Forgery-Proof** | Cryptographic signatures verify authenticity |
| 🌍 **Decentralized** | Data stays with merchants, no central database |
| 🌐 **International** | Multi-currency, multi-language support |
| 📱 **Offline-First** | Scan QR offline; receipt loads when connected |

## Why eQ?

### The Problem

- **30+ proprietary solutions** with incompatible formats
- **Billions of paper receipts** printed annually (environmental waste)
- **No interoperability** - data trapped in silos
- **Existing "standards"** controlled by commercial interests

### The Solution

eQ provides a **single, open format** that:
- Works with any POS system
- Works with any consumer app
- Works in any country
- Belongs to no one (and everyone)

## Quick Example

```json
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
    "items": [
      {
        "description": "Organic Milk 1L",
        "quantity": 2,
        "unit_price": 2.90,
        "total_price": 5.80,
        "identifiers": { "gtin": "7612345678901" }
      }
    ],
    "totals": {
      "grand_total": 5.80
    }
  }
}
```

## Use Cases

- 📄 **Paperless Receipts** - No more paper clutter
- 📊 **Automatic Bookkeeping** - Direct import to accounting software
- 🛡️ **Warranty Tracking** - Never lose a warranty again
- 🍎 **Health Apps** - Track nutrition from grocery purchases
- ⚠️ **Product Recalls** - Get notified if you bought a recalled product
- 💼 **Expense Reports** - Auto-categorized business expenses
- 🔒 **Insurance Claims** - Find receipts instantly after theft or damage

## Getting Started

### For Developers

```bash
# Validate an eQ receipt
npm install @eqstandard/validator
```

```javascript
import { validate } from '@eqstandard/validator';

const result = validate(receiptJson);
console.log(result.valid); // true/false
```

### For Businesses

1. Read the [Specification](/spec/SPECIFICATION.md)
2. Implement eQ export in your POS
3. Test with our [validation tool](https://verify.eqstandard.org)
4. Add "eQ Compatible" badge

## Documentation

| Document | Description |
|----------|-------------|
| [Specification](/spec/SPECIFICATION.md) | Full technical specification |
| [Charter](/spec/CHARTER.md) | Project vision and governance |
| [Design Decisions](/spec/DESIGN_DECISIONS.md) | Rationale behind decisions |

## Status

🚧 **Current Status: Draft Specification**

We are actively seeking:
- Feedback on the specification
- Early adopter partners (POS vendors, apps)
- Contributors to reference implementations

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- 💬 [Discussions](https://github.com/eqstandard/eQ/discussions) - Ask questions, share ideas
- 🐛 [Issues](https://github.com/eqstandard/eQ/issues) - Report bugs, request features
- 🔧 [Pull Requests](https://github.com/eqstandard/eQ/pulls) - Contribute code or docs

## License

- **Specification & Documentation:** [CC-BY-4.0](LICENSE-DOCS)
- **Code & Reference Implementations:** [Apache 2.0](LICENSE-CODE)

## Contact

- Website: [eqstandard.org](https://eqstandard.org)
- GitHub: [github.com/eqstandard/eQ](https://github.com/eqstandard/eQ)
- Email: hello@eqstandard.org

---

<p align="center">
  <sub>eQ is an open community project. Not controlled by any single company.</sub>
</p>
