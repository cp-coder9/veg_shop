import { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea } from '@/components/ui';

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
        <Modal
            isOpen={true}
            onClose={onClose}
            title={supplier ? 'Edit Supplier' : 'Add Supplier'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                        Name
                    </label>
                    <Input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="font-accent text-caption text-warm-gray uppercase tracking-wide mb-2 block">
                        Contact Info (Optional)
                    </label>
                    <Textarea
                        value={contactInfo}
                        onChange={(e) => setContactInfo(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
