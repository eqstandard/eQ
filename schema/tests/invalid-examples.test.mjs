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

// Tests that SHOULD fail validation
const negativeTests = [
  {
    name: "Missing eq_version",
    data: { "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "Invalid currency (lowercase)",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "chf", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "Invalid receipt_type",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "purchase", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } } } },
    validator: validateReceipt
  },
  {
    name: "Invalid payment method",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "bitcoin", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "Sale missing items/transaction/taxes/totals",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } } } },
    validator: validateReceipt
  },
  {
    name: "Refund missing refund_info",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "refund", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": -1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": -1, "unit": "piece", "unit_price": 1, "total_price": -1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": -1, "tax_amount": 0 }], "totals": { "subtotal": -1, "tax_total": 0, "total": -1, "grand_total": -1, "amount_paid": -1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "Void missing void_info",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "void", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } } } },
    validator: validateReceipt
  },
  {
    name: "Invalid GTIN (wrong length)",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero", "identifiers": { "gtin": "12345" } }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "Invalid country code (3 chars)",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CHE" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 } } },
    validator: validateReceipt
  },
  {
    name: "QR payload missing token",
    data: { "eq": "1.0", "endpoint": "https://shop.example.ch/eq/v1", "receipt_id": "550e8400-e29b-41d4-a716-446655440000" },
    validator: validateQR
  },
  {
    name: "QR payload extra field (additionalProperties)",
    data: { "eq": "1.0", "endpoint": "https://shop.example.ch/eq/v1", "receipt_id": "550e8400-e29b-41d4-a716-446655440000", "token": "abc", "extra": "not-allowed" },
    validator: validateQR
  },
  {
    name: "Invalid signature algorithm",
    data: { "eq_version": "1.0.0", "receipt": { "id": "550e8400-e29b-41d4-a716-446655440000", "issued_at": "2026-01-31T14:30:00+01:00", "timezone": "Europe/Zurich", "receipt_type": "sale", "currency": "CHF", "merchant": { "name": "X", "address": { "line1": "A", "city": "B", "country": "CH" } }, "transaction": { "transaction_id": "T1", "payments": [{ "method": "cash", "amount": 1 }] }, "items": [{ "line_number": 1, "description": "X", "quantity": 1, "unit": "piece", "unit_price": 1, "total_price": 1, "tax_rate": 0, "tax_category": "zero" }], "taxes": [{ "tax_category": "zero", "tax_rate": 0, "taxable_amount": 1, "tax_amount": 0 }], "totals": { "subtotal": 1, "tax_total": 0, "total": 1, "grand_total": 1, "amount_paid": 1, "amount_due": 0 }, "signatures": { "merchant": { "algorithm": "HS256", "key_id": "k1", "certificate_url": "https://x.com/cert.pem", "signed_fields": ["receipt"], "signature": "abc" } } } },
    validator: validateReceipt
  }
];

let allRejected = true;

for (const test of negativeTests) {
  const valid = test.validator(test.data);
  if (!valid) {
    const firstErr = test.validator.errors[0];
    console.log(`PASS  ${test.name}  → rejected: ${firstErr.instancePath || "/"} ${firstErr.message}`);
  } else {
    allRejected = false;
    console.log(`FAIL  ${test.name}  → should have been rejected but was accepted`);
  }
}

console.log("\n" + (allRejected ? "All negative tests passed (all correctly rejected)." : "Some negative tests FAILED (incorrectly accepted)."));
process.exit(allRejected ? 0 : 1);
