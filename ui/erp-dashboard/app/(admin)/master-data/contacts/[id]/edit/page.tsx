import ContactForm from '@/components/master-data/contacts/ContactForm';
import { use } from 'react';

interface EditContactPageProps {
  params: {
    id: string;
  };
}

export default function EditContactPage({ params }: EditContactPageProps) {
  return <ContactForm mode="edit" contactId={params.id} />;
}
