import React, { useState, useEffect } from 'react';
import { useOrderWindowStatus } from '../../hooks/useOrders.js';
import { Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const OrderWindowBanner: React.FC = () => {
    const { data: status, isLoading } = useOrderWindowStatus();
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!status?.nextStatusChange) return;

        const updateTimer = () => {
            const nextChange = new Date(status.nextStatusChange);
            if (nextChange > new Date()) {
                setTimeLeft(formatDistanceToNow(nextChange, { addSuffix: false }));
            } else {
                setTimeLeft('closing now...');
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [status]);

    if (isLoading || !status) return null;

    return (
        <div
            className={`w-full py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-medium transition-all ${status.isOpen
                ? 'bg-primary/10 text-primary border-b border-primary/20'
                : 'bg-destructive/10 text-destructive border-b border-destructive/20'
                }`}
        >
            <div className="flex items-center gap-2">
                {status.isOpen ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                ) : (
                    <AlertCircle className="h-4 w-4" />
                )}
                <span>{status.message}</span>
            </div>

            {status.isOpen && timeLeft && (
                <div className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Closes in: <span className="font-bold">{timeLeft}</span></span>
                </div>
            )}

            {!status.isOpen && status.nextStatusChange && (
                <div className="flex items-center gap-2 bg-destructive/20 px-3 py-1 rounded-full text-xs">
                    <span>Opens in {formatDistanceToNow(new Date(status.nextStatusChange))}</span>
                </div>
            )}
        </div>
    );
};
