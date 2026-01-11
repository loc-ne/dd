export default function HostInfo({ host }: { host: any }) {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Thông tin chủ nhà</h3>
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md">
                    {host.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                    <p className="font-semibold text-lg text-gray-900">{host.fullName || 'Người dùng'}</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="break-all">{host.email}</span>
                </div>
                {host.phoneNumber && (
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{host.phoneNumber}</span>
                    </div>
                )}
            </div>
        </div>
    );
}