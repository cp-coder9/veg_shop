import { useState, useEffect } from 'react';

interface Supplier {
    id: string;
    name: string;
    contactInfo: string | null;
    isAvailable: boolean;
}

interface SupplierModalProps {
    supplier: Supplier | null;
    onClose: () => void;
    onSave: (data: { name: string; contactInfo: string }) => Promise<void>;
}

export default function SupplierModal({
    supplier,
    onClose,
    onSave
}: SupplierModalProps) {
    const [name, setName] = useState(supplier?.name || '');
    const [contactInfo, setContactInfo] = useState(supplier?.contactInfo || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (supplier) {
            setName(supplier.name);
            setContactInfo(supplier.contactInfo || '');
        } else {
            setName('');
            setContactInfo('');
        }
    }, [supplier]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({ name, contactInfo });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">
                    {supplier ? 'Edit Supplier' : 'Add Supplier'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Info (Optional)
                        </label>
                        <textarea
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
