import { useState, useEffect } from 'react';
import { useTodayLog, useCreateLog, useUpdateLog } from '../../hooks/useDriverLogs';
import { toast } from 'react-hot-toast';

export default function LogbookPage() {
    const { data: todayLog, isLoading } = useTodayLog();
    const createLog = useCreateLog();
    const updateLog = useUpdateLog();

    const [startKm, setStartKm] = useState<string>('');
    const [vehicleReg, setVehicleReg] = useState<string>('');
    const [endKm, setEndKm] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        if (todayLog) {
            setStartKm(todayLog.startKm.toString());
            setVehicleReg(todayLog.vehicleReg || '');
            setNotes(todayLog.notes || '');
            if (todayLog.endKm) {
                setEndKm(todayLog.endKm.toString());
            }
        }
    }, [todayLog]);

    const handleStartTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createLog.mutateAsync({
                startKm: parseFloat(startKm),
                vehicleReg,
                notes
            });
            toast.success('Trip started successfully');
        } catch (error) {
            toast.error('Failed to start trip');
        }
    };

    const handleEndTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!todayLog) return;
        try {
            await updateLog.mutateAsync({
                id: todayLog.id,
                data: {
                    endKm: parseFloat(endKm),
                    notes
                }
            });
            toast.success('Trip ended and KMs recorded');
        } catch (error) {
            toast.error('Failed to end trip');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Driver Logbook</h1>

            {!todayLog ? (
                <div className="card p-6 bg-white shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Start Your Day</h2>
                    <form onSubmit={handleStartTrip} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Registration</label>
                            <input
                                type="text"
                                required
                                value={vehicleReg}
                                onChange={(e) => setVehicleReg(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 border"
                                placeholder="e.g. CA 123456"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Starting KM</label>
                            <input
                                type="number"
                                required
                                value={startKm}
                                onChange={(e) => setStartKm(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 border"
                                placeholder="0"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={createLog.isPending}
                            className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            {createLog.isPending ? 'Saving...' : 'Start Trip'}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="card p-6 bg-white shadow-md space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                        <div>
                            <p className="text-sm text-gray-500">Vehicle</p>
                            <p className="font-bold">{todayLog.vehicleReg}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Started at</p>
                            <p className="font-bold">{todayLog.startKm} KM</p>
                        </div>
                    </div>

                    {!todayLog.endKm ? (
                        <form onSubmit={handleEndTrip} className="space-y-4">
                            <h2 className="text-lg font-semibold">End Your Day</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ending KM</label>
                                <input
                                    type="number"
                                    required
                                    min={todayLog.startKm}
                                    value={endKm}
                                    onChange={(e) => setEndKm(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 border"
                                    placeholder={todayLog.startKm.toString()}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-3 py-2 border"
                                    rows={3}
                                    placeholder="Any issues or observations?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={updateLog.isPending}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {updateLog.isPending ? 'Saving...' : 'End Trip & Record KMs'}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-green-50 p-4 rounded-lg space-y-2">
                            <div className="flex justify-between text-green-800 font-bold">
                                <span>Day Completed</span>
                                <span>Total: {todayLog.endKm - todayLog.startKm} KM</span>
                            </div>
                            <p className="text-sm text-green-700">Ending KM: {todayLog.endKm}</p>
                            {todayLog.notes && <p className="text-sm text-green-700 italic">Notes: {todayLog.notes}</p>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
