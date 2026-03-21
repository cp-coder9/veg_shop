import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';
import { Modal, Button } from '../ui/index.js';
import { ShieldCheck, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const PrivacyConsent: React.FC = () => {
    const { user, confirmPopiConsent } = useAuthStore();
    const [isOpen, setIsOpen] = useState(!!user && !user.popiConsentGiven);
    const [isLoading, setIsLoading] = useState(false);

    // Policy version - change this to force re-consent
    const POLICY_VERSION = '2024.1';

    const handleAccept = async () => {
        setIsLoading(true);
        try {
            await confirmPopiConsent(POLICY_VERSION);
            setIsOpen(false);
            (toast as any).success('Privacy policy accepted');
        } catch (error) {
            (toast as any).error('Failed to accept privacy policy');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user || user.popiConsentGiven) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { }} // User MUST accept to continue
            title="Privacy & POPI Act Consent"
            size="lg"
        >
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg text-primary">
                    <ShieldCheck className="h-6 w-6 shrink-0" />
                    <p className="text-sm font-medium">
                        Your privacy is important to us. We need your consent to collect and process your personal information.
                    </p>
                </div>

                <div className="prose prose-sm max-h-60 overflow-y-auto pr-2 border-y border-border py-4 scrollbar-thin scrollbar-thumb-muted">
                    <h4 className="font-bold">What information we collect:</h4>
                    <ul>
                        <li>Name and contact details (email, phone)</li>
                        <li>Physical address for deliveries</li>
                        <li>Order history and preferences</li>
                    </ul>

                    <h4 className="font-bold">Why we collect it:</h4>
                    <p>
                        We use this information solely to process your orders, arrange deliveries, and communicate updates about your orders.
                        Your data is stored securely and never shared with third parties except for delivery purposes.
                    </p>

                    <div className="flex items-start gap-2 bg-muted p-3 rounded text-xs text-muted-foreground mt-4">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                            By clicking "I Accept", you consent to the processing of your personal information in accordance with the
                            Protection of Personal Information Act (POPI Act).
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleAccept}
                        isLoading={isLoading}
                        className="w-full sm:w-auto"
                    >
                        I Accept and Understand
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
