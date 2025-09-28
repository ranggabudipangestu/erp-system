import ProtectedPermissionRoute from "@/components/auth/ProtectedPermissionRoute";
import ContactForm from "@/components/master-data/contacts/ContactForm";
import { PermissionProvider } from "@/hooks/usePermissions";

export default function CreateContactPage() {
  return (
    <PermissionProvider>
      <ProtectedPermissionRoute permission="contacts.view" action="can_create" redirectTo='/master-data/contacts'>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ContactForm mode="create" />
          </div>
        </div>
      </ProtectedPermissionRoute>
    </PermissionProvider>
  );
}
