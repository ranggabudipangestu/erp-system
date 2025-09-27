import { use } from 'react';
import EditRolePageContent from '@/components/permissions/EditRolePageContent';

type PageParams = {
  params: Promise<{ id?: string | string[] }>;
};

export default function EditRolePage({ params }: PageParams) {
  const resolvedParams = use(params);
  const rawId = resolvedParams?.id;
  const roleId = Array.isArray(rawId) ? rawId[0] : rawId;

  return <EditRolePageContent roleId={roleId} />;
}