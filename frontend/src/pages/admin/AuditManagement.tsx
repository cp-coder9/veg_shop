import { useState } from 'react';
import { useAdminAudit, AuditFilters } from '../../hooks/useAdminAudit';

export default function AuditManagement() {
    const [filters, setFilters] = useState<AuditFilters>({
        limit: 50,
        offset: 0,
    });

    const { data, isLoading, isError } = useAdminAudit(filters);

    const handleFilterChange = (key: keyof AuditFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <div className="text-sm text-gray-500">
                    Total Logs: {data?.total || 0}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Action</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Filter by action..."
                        onChange={(e) => handleFilterChange('action', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Resource</label>
                    <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Filter by resource..."
                        onChange={(e) => handleFilterChange('resource', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Start Date</label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg"
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">End Date</label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg"
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data?.logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.createdAt).toLocaleString('en-ZA')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {log.user?.name || 'System'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.action.includes('error') ? 'bg-red-100 text-red-800' :
                                                log.action.includes('create') ? 'bg-green-100 text-green-800' :
                                                    log.action.includes('update') ? 'bg-blue-100 text-blue-800' :
                                                        log.action.includes('delete') ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                        {log.resource} {log.resourceId && `(${log.resourceId.slice(0, 8)})`}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details || ''}>
                                        {log.details || '-'}
                                    </td>
                                </tr>
                            ))}
                            {data?.logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
