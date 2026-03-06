'use client';

import { useParams } from 'next/navigation';
import PaymentTermForm from '@/components/master-data/payment-terms/PaymentTermForm';

export default function EditPaymentTermPage() {
  const params = useParams();
  const paymentTermId = params.id as string;

  return <PaymentTermForm mode="edit" paymentTermId={paymentTermId} />;
}