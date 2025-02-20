import ProtectedRoute from '@/components/utils/ProtectedRoute'

interface Props {
	children: React.ReactNode;
}

export default function Layout({ children }: Props) {
	return <>{children}</>;
}