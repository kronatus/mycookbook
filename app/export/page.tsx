import DataExport from '../../components/DataExport';

export default function ExportPage() {
  // TODO: Get userId from authentication session
  // For now, using a placeholder - this should be replaced with actual auth
  const userId = 'placeholder-user-id';

  return (
    <div className="min-h-screen bg-gray-50">
      <DataExport userId={userId} />
    </div>
  );
}

export const metadata = {
  title: 'Data Export & Import - Personal Cookbook',
  description: 'Export, backup, and import your recipe collection',
};