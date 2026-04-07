import BarangayAdminLayout from '../components/layout/BarangayAdminLayout'
import AdminGuideContent from '../components/help/AdminGuideContent'

export default function BarangayHowToUsePage() {
  return (
    <BarangayAdminLayout>
      <AdminGuideContent variant="barangay" />
    </BarangayAdminLayout>
  )
}
