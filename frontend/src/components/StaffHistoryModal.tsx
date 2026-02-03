import { X, Package, Truck, Calendar } from 'lucide-react';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { Order } from '../types';

interface StaffHistoryModalProps {
    user: {
        id: string;
        name: string;
        role: 'packer' | 'driver';
    };
    onClose: () => void;
}

export default function StaffHistoryModal({ user, onClose }: StaffHistoryModalProps) {
    const { data: orders, isLoading } = useAdminOrders({
        [user.role === 'packer' ? 'packerId' : 'driverId']: user.id
    });

    const completedOrders = orders?.filter(o =>
        user.role === 'packer' ? o.status === 'packed' : o.status === 'delivered'
    ) || [];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            {user.role === 'packer' ? <Package className="text-brand-600" /> : <Truck className="text-brand-600" />}
                            {user.name}'s History
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {user.role === 'packer' ? 'Packed Orders' : 'Delivered Orders'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                        </div>
                    ) : completedOrders.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p>No completed orders found for this {user.role}.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {completedOrders.map((order: Order) => (
                                <div key={order.id} className="border border-gray-100 rounded-lg p-4 hover:border-brand-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                #{order.id.slice(-6)}
                                            </span>
                                            <h3 className="font-bold text-gray-900 mt-1">{order.customer?.name || 'Unknown Customer'}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'packed' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3 border-t border-gray-50 pt-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            {new Date(order.deliveryDate).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Package size={14} />
                                            {order.items?.length || 0} items
                                        </div>
                                        {user.role === 'packer' && order.packerSignature && (
                                            <div className="ml-auto text-xs italic">
                                                Signed: {order.packerSignature}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl text-right text-sm text-gray-500">
                    Total: {completedOrders.length} orders
                </div>
            </div>
        </div>
    );
}
