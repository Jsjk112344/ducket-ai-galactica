// Ducket AI Galactica — Seller listing form (Step 1 of resale flow)
// Seller fills in ticket details; onSubmit POSTs to API and advances to step 2.
// Pre-filled with FIFA World Cup 2026 demo data for judges.
// Apache 2.0 License

import { useState } from 'react';
import { NewListing } from '../hooks/useResaleFlow';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ListingFormProps {
  onSubmit: (data: NewListing) => Promise<void>;
}

export function ListingForm({ onSubmit }: ListingFormProps) {
  const [form, setForm] = useState<NewListing>({
    eventName: 'FIFA World Cup 2026 — USA vs England',
    section: 'Category 2',
    quantity: 2,
    price: 350,
    faceValue: 120,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-heading font-semibold text-white mb-4">List a Ticket</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          {/* Event Name — full row */}
          <div className="col-span-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={form.eventName}
              onChange={(e) => setForm({ ...form, eventName: e.target.value })}
              required
            />
          </div>

          {/* Section */}
          <div>
            <Label htmlFor="section">Section</Label>
            <Input
              id="section"
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              required
            />
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: +e.target.value })}
              required
            />
          </div>

          {/* Ask Price */}
          <div>
            <Label htmlFor="price">Ask Price (USD)</Label>
            <Input
              id="price"
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: +e.target.value })}
              required
            />
          </div>

          {/* Face Value */}
          <div>
            <Label htmlFor="faceValue">Face Value (USD)</Label>
            <Input
              id="faceValue"
              type="number"
              min={1}
              value={form.faceValue}
              onChange={(e) => setForm({ ...form, faceValue: +e.target.value })}
              required
            />
          </div>

          {/* Submit — full row */}
          <div className="col-span-2">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Submitting...' : 'Submit Listing'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
