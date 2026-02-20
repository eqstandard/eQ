import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const receiptSchema = JSON.parse(
  readFileSync(resolve(__dirname, "../v1/receipt.schema.json"), "utf-8")
);
const qrSchema = JSON.parse(
  readFileSync(resolve(__dirname, "../v1/qr-payload.schema.json"), "utf-8")
);

const validateReceipt = ajv.compile(receiptSchema);
const validateQR = ajv.compile(qrSchema);

// Complete receipt example from SPECIFICATION.md §11
const completeReceipt = {
  "$schema": "https://eqstandard.org/schema/v1/receipt.json",
  "eq_version": "1.0.0",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "sale",
    "receipt_number": "R-2026-00001234",
    "currency": "CHF",
    "language": "de-CH",
    "merchant": {
      "name": "Bio Market",
      "tax_id": "CHE-123.456.789 MWST",
      "tax_id_type": "CH_MWST",
      "address": {
        "line1": "Bahnhofstrasse 1",
        "line2": null,
        "city": "Zürich",
        "postal_code": "8001",
        "subdivision": "ZH",
        "country": "CH"
      },
      "address_standard": "EN16931"
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
        "description_i18n": {
          "de": "Bio Vollmilch 1L",
          "fr": "Lait bio entier 1L",
          "en": "Organic Whole Milk 1L"
        },
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
};

// Refund receipt example from §4.3.3
const refundReceipt = {
  "eq_version": "1.0.0",
  "receipt": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "issued_at": "2026-02-01T10:00:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "refund",
    "currency": "CHF",
    "merchant": {
      "name": "Fashion Store",
      "address": { "line1": "Limmatquai 10", "city": "Zürich", "country": "CH" }
    },
    "refund_info": {
      "original_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
      "original_date": "2026-01-15",
      "partial_return": true,
      "reason": "customer_return"
    },
    "transaction": {
      "transaction_id": "TXN-20260201-000001",
      "payments": [{ "method": "card", "amount": -29.90 }]
    },
    "items": [
      {
        "line_number": 1,
        "description": "Blue T-Shirt (RETURNED)",
        "quantity": -1,
        "unit": "piece",
        "unit_price": 29.90,
        "total_price": -29.90,
        "tax_rate": 8.1,
        "tax_category": "standard",
        "original_line_number": 2
      }
    ],
    "taxes": [
      { "tax_category": "standard", "tax_rate": 8.1, "taxable_amount": -29.90, "tax_amount": -2.42 }
    ],
    "totals": {
      "subtotal": -29.90,
      "tax_total": -2.42,
      "total": -32.32,
      "grand_total": -29.90,
      "amount_paid": -29.90,
      "amount_due": 0.00
    }
  }
};

// Void receipt example from §4.3.4
const voidReceipt = {
  "eq_version": "1.0.0",
  "receipt": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "issued_at": "2026-01-31T14:35:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "void",
    "currency": "CHF",
    "merchant": {
      "name": "Bio Market",
      "address": { "line1": "Bahnhofstrasse 1", "city": "Zürich", "country": "CH" }
    },
    "void_info": {
      "voided_receipt_id": "550e8400-e29b-41d4-a716-446655440000",
      "voided_at": "2026-01-31T14:35:00+01:00",
      "reason": "customer_cancelled"
    }
  }
};

// Receipt with signatures from §3.2
const signedReceipt = {
  "eq_version": "1.0.0",
  "receipt": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "issued_at": "2026-01-31T14:30:00+01:00",
    "timezone": "Europe/Zurich",
    "receipt_type": "sale",
    "currency": "CHF",
    "merchant": {
      "name": "TechStore AG",
      "tax_id": "CHE-999.888.777",
      "tax_id_type": "CH_UID",
      "address": { "line1": "Techpark 5", "city": "Bern", "country": "CH" },
      "contact": { "website": "https://techstore.ch" }
    },
    "transaction": {
      "transaction_id": "TXN-001",
      "payments": [{ "method": "card", "amount": 99.00, "reference": "MSG-20260131-001234" }]
    },
    "items": [
      {
        "line_number": 1,
        "description": "USB-C Cable",
        "quantity": 1,
        "unit": "piece",
        "unit_price": 99.00,
        "total_price": 99.00,
        "tax_rate": 8.1,
        "tax_category": "standard",
        "identifiers": { "gtin": "7612345678903" }
      }
    ],
    "taxes": [
      { "tax_category": "standard", "tax_rate": 8.1, "taxable_amount": 99.00, "tax_amount": 8.02 }
    ],
    "totals": {
      "subtotal": 99.00,
      "tax_total": 8.02,
      "total": 107.02,
      "grand_total": 107.00,
      "amount_paid": 107.00,
      "amount_due": 0.00
    },
    "signatures": {
      "merchant": {
        "algorithm": "ES256",
        "key_id": "merchant-key-2026-01",
        "certificate_url": "https://techstore.ch/.well-known/eq/cert.pem",
        "signed_fields": ["receipt"],
        "signature": "MEUCIQDf4base64signature"
      }
    }
  }
};

// QR payload example from §6.2
const qrPayload = {
  "eq": "1.0",
  "endpoint": "https://shop.example.ch/eq/v1",
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123-access-token",
  "issued_at": "2026-01-31T14:30:00+01:00"
};

// QR payload without optional issued_at
const qrPayloadMinimal = {
  "eq": "1.0",
  "endpoint": "https://shop.example.ch/eq/v1",
  "receipt_id": "550e8400-e29b-41d4-a716-446655440000",
  "token": "abc123-access-token"
};

// --- Run validations ---
const tests = [
  { name: "Complete receipt (§11)", data: completeReceipt, validator: validateReceipt },
  { name: "Refund receipt", data: refundReceipt, validator: validateReceipt },
  { name: "Void receipt", data: voidReceipt, validator: validateReceipt },
  { name: "Signed receipt", data: signedReceipt, validator: validateReceipt },
  { name: "QR payload (full)", data: qrPayload, validator: validateQR },
  { name: "QR payload (minimal)", data: qrPayloadMinimal, validator: validateQR },
];

let allPassed = true;

for (const test of tests) {
  const valid = test.validator(test.data);
  if (valid) {
    console.log(`PASS  ${test.name}`);
  } else {
    allPassed = false;
    console.log(`FAIL  ${test.name}`);
    for (const err of test.validator.errors) {
      console.log(`      ${err.instancePath || "/"} — ${err.message} ${err.params ? JSON.stringify(err.params) : ""}`);
    }
  }
}

console.log("\n" + (allPassed ? "All tests passed." : "Some tests FAILED."));
process.exit(allPassed ? 0 : 1);
