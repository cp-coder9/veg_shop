<?php
/**
 * Notification Service
 * 
 * Handles sending notifications via WhatsApp and Email
 */

declare(strict_types=1);

namespace App\Services;

use App\Services\FirebaseService;
use Ramsey\Uuid\Uuid;

class NotificationService
{
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->firebase = new FirebaseService();
    }

    /**
     * Send order confirmation
     */
    public function sendOrderConfirmation(string $orderId): void
    {
        $order = $this->firebase->getDocument('orders', $orderId);

        if (!$order)
            return;

        $customer = $this->firebase->getDocument('users', $order['customer_id']);
        if (!$customer)
            return;

        $items = $this->firebase->query('order_items', 'order_id', '==', $orderId);

        $itemList = "";
        foreach ($items as $item) {
            $product = $this->firebase->getDocument('products', $item['product_id']);
            $name = $product['name'] ?? 'Unknown';
            $itemList .= "- {$name} x {$item['quantity']}\n";
        }

        // Calculate total if not stored
        $total = $order['total_amount'] ?? 0;
        if ($total == 0) {
            foreach ($items as $item) {
                $total += ($item['quantity'] ?? 0) * ($item['price_at_order'] ?? 0);
            }
        }

        $message = "Hi {$customer['name']}, thanks for your order!\n\nDetails:\n{$itemList}\nTotal: R{$total}\n\nWe'll let you know when it's on the way.";

        // Queue notification
        $this->queueNotification($order['customer_id'], 'order_confirmation', 'whatsapp', $message);
        $this->queueNotification($order['customer_id'], 'order_confirmation', 'email', $message);
    }

    /**
     * Queue a notification
     */
    private function queueNotification(string $customerId, string $type, string $method, string $content): void
    {
        $id = Uuid::uuid4()->toString();
        $this->firebase->createDocument('notifications', $id, [
            'id' => $id,
            'customer_id' => $customerId,
            'type' => $type,
            'method' => $method,
            'content' => $content,
            'status' => 'pending',
            'created_at' => date('c')
        ]);
    }

    /**
     * Process pending notifications (called by cron)
     */
    public function processPending(): void
    {
        $pending = $this->firebase->query('notifications', 'status', '==', 'pending');

        foreach ($pending as $notification) {
            try {
                if ($notification['method'] === 'whatsapp') {
                    $this->sendWhatsApp($notification);
                } elseif ($notification['method'] === 'email') {
                    $this->sendEmail($notification);
                }

                $this->firebase->updateDocument('notifications', $notification['id'], [
                    'status' => 'sent',
                    'sent_at' => date('c')
                ]);
            } catch (\Exception $e) {
                $this->firebase->updateDocument('notifications', $notification['id'], [
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Send WhatsApp (Mock implementation)
     */
    private function sendWhatsApp(array $notification): void
    {
        // Integration with WhatsApp API provider
    }

    /**
     * Send Email (Mock implementation)
     */
    private function sendEmail(array $notification): void
    {
        // Integration with SMTP or Email Provider
    }
}
