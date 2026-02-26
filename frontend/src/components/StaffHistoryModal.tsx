import { X, Package, Truck, Calendar } from 'lucide-react';
import { useAdminOrders } from '../hooks/useAdminOrders';
import { Order } from '../types';
import { Modal, Badge } from '@/components/ui';

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return <Badge variant="success">{status}</Badge>;
            case 'packed':
                return <Badge variant="info">{status}</Badge>;
            default:
                return <Badge variant="default">{status}</Badge>;
        }
    };

    const RoleIcon = user.role === 'packer' ? Package : Truck;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="xl"
        >
            {/* Custom Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-light-gray">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
                        <RoleIcon size={20} />
                    </div>
                    <div>
                        <h2 className="font-display text-body-lg text-primary-dark">
                            {user.name}'s History
                        </h2>
                        <p className="font-body text-body-sm text-warm-gray">
                            {user.role === 'packer' ? 'Packed Orders' : 'Delivered Orders'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 hover:bg-light-gray rounded-full text-warm-gray hover:text-primary-dark transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
                    </div>
                ) : completedOrders.length === 0 ? (
                    <div className="text-center py-12 font-body text-body-md text-warm-gray bg-cream/50 rounded-lg border border-dashed border-light-gray">
                        <p>No completed orders found for this {user.role}.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {completedOrders.map((order: Order) => (
                            <div 
                                key={order.id} 
                                className="border border-light-gray rounded-lg p-4 hover:border-terracotta/30 hover:bg-cream/30 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-accent text-overline bg-cream px-2 py-1 rounded text-warm-gray">
                                            #{order.id.slice(-6)}
                                        </span>
                                        <h3 className="font-body text-body-md font-semibold text-primary-dark mt-1">
                                            {order.customer?.name || 'Unknown Customer'}
                                        </h3>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>

                                <div className="flex items-center gap-4 font-body text-body-sm text-warm-gray mt-3 border-t border-light-gray/50 pt-3">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(order.deliveryDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Package size={14} />
                                        {order.items?.length || 0} items
                                    </div>
                                    {user.role === 'packer' && order.packerSignature && (
                                        <div className="ml-auto font-accent text-caption italic">
                                            Signed: {order.packerSignature}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-light-gray font-body text-body-sm text-warm-gray text-right">
                Total: <span className="font-semibold text-primary-dark">{completedOrders.length}</span> orders
            </div>
        </Modal>
    );
}
