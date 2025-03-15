import InvitationForm from '../components/InvitationForm';

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Send a Coffee Invitation
          </h1>
          <p className="mt-2 text-gray-600">
            Invite someone for a coffee chat using their Lark ID
          </p>
        </div>
        <InvitationForm />
      </div>
    </div>
  );
} 