<?php
/**
 * Auth Service
 * 
 * Handles authentication, JWT tokens, and password hashing
 */

declare(strict_types=1);

namespace App\Services;

use App\Config\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Ramsey\Uuid\Uuid;

class AuthService
{
    private string $jwtSecret;
    private int $accessExpiry;
    private int $refreshExpiry;
    private FirebaseService $firebase;

    public function __construct()
    {
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'default-secret-change-me';
        $this->accessExpiry = (int) ($_ENV['JWT_ACCESS_EXPIRY'] ?? 900); // 15 minutes
        $this->refreshExpiry = (int) ($_ENV['JWT_REFRESH_EXPIRY'] ?? 604800); // 7 days
        $this->firebase = new FirebaseService();
    }

    /**
     * Hash a password (Legacy - used for non-Firebase fallback if needed)
     */
    public function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_DEFAULT);
    }

    /**
     * Verify a password against a hash (Legacy)
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Register a new user
     */
    public function register(array $data): array
    {
        // 1. Create user in Firebase Auth
        try {
            $authResult = $this->firebase->signUp($data['email'], $data['password']);
            $firebaseUid = $authResult['localId'];
        } catch (\Exception $e) {
            // Check if error is "EMAIL_EXISTS"
            if (str_contains($e->getMessage(), 'EMAIL_EXISTS')) {
                throw new \Exception('Email already registered');
            }
            throw $e;
        }

        // 2. Create user profile in Firestore
        $userId = $firebaseUid; // Use Firebase UID as the document ID

        $userData = [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'role' => $data['role'] ?? 'customer',
            'status' => 'active',
            'loyaltyPoints' => 0,
            'deliveryPreference' => 'house',
            'createdAt' => date('c'),
            'updatedAt' => date('c')
        ];

        $this->firebase->createDocument('users', $userId, $userData);

        // 3. Log registration
        $this->logAudit($userId, 'REGISTER_SUCCESS', 'authentication', null, json_encode(['email' => $data['email']]));

        // 4. Generate tokens
        return $this->generateTokens([
            'id' => $userId,
            'name' => $data['name'],
            'role' => $data['role'] ?? 'customer'
        ]);
    }

    /**
     * Login with email and password
     */
    public function login(string $email, string $password): array
    {
        try {
            // 1. Authenticate with Firebase Auth
            $authResult = $this->firebase->signIn($email, $password);
            $userId = $authResult['localId'];

            // 2. Fetch user profile from Firestore
            $user = $this->firebase->getDocument('users', $userId);

            if (!$user) {
                // Should not happen if Auth succeeded, but safety first
                throw new \Exception('User profile not found');
            }

            // 3. Log success
            $this->logAudit($userId, 'AUTH_SUCCESS', 'authentication', null, json_encode([
                'email' => $email,
                'method' => 'password'
            ]));

            return $this->generateTokens([
                'id' => $userId,
                'name' => $user['name'] ?? 'User',
                'role' => $user['role'] ?? 'customer'
            ]);
        } catch (\Exception $e) {
            $this->logAudit(null, 'AUTH_FAILED', 'authentication', null, json_encode([
                'email' => $email,
                'reason' => $e->getMessage()
            ]));
            throw new \Exception('Invalid email or password');
        }
    }

    /**
     * Development login (bypass password)
     * For dev shortcut emails, resolves to a REAL Firestore user with matching role
     * so that all dashboard workflows work correctly (orders, lookups, etc.)
     */
    public function devLogin(string $email): array
    {
        // Map dev shortcut emails → the role to look up in Firestore
        $devRoleMap = [
            'admin@vegshop.com' => 'admin',
            'john@example.com' => 'customer',
            'packer@vegshop.com' => 'packer',
            'driver@vegshop.com' => 'driver',
        ];

        if (isset($devRoleMap[$email])) {
            $role = $devRoleMap[$email];

            // Find the first real Firestore user with that role
            $results = $this->firebase->query('users', 'role', '==', $role);

            if (!empty($results)) {
                $user = $results[0];
                return $this->generateTokens([
                    'id' => $user['id'],
                    'name' => $user['name'] ?? ucfirst($role),
                    'role' => $user['role']
                ]);
            }

            // No real user with that role exists yet — use placeholder
            return $this->generateTokens([
                'id' => 'dev-' . $role,
                'name' => ucfirst($role),
                'role' => $role
            ]);
        }

        // Regular real-user lookup by email
        $results = $this->firebase->query('users', 'email', '==', $email);

        if (empty($results)) {
            throw new \Exception('User not found');
        }

        $user = $results[0];

        return $this->generateTokens([
            'id' => $user['id'],
            'name' => $user['name'],
            'role' => $user['role']
        ]);
    }

    /**
     * Generate verification code (Unused in simple Firebase Auth, but kept for logic)
     */
    public function generateVerificationCode(): string
    {
        return str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Store verification code
     */
    public function storeVerificationCode(string $contact, string $code): void
    {
        $id = Uuid::uuid4()->toString();
        $this->firebase->createDocument('verification_codes', $id, [
            'contact' => $contact,
            'code' => $code,
            'expires_at' => date('Y-m-d H:i:s', time() + 600)
        ]);
    }

    /**
     * Verify code and login
     */
    public function verifyCode(string $contact, string $code): array
    {
        $results = $this->firebase->query('verification_codes', 'contact', '==', $contact);

        $match = null;
        foreach ($results as $v) {
            if ($v['code'] === $code && strtotime($v['expires_at']) > time()) {
                $match = $v;
                break;
            }
        }

        if (!$match) {
            $this->logAudit(null, 'AUTH_FAILED', 'authentication', null, json_encode([
                'contact' => $contact,
                'reason' => 'Invalid or expired code'
            ]));
            throw new \Exception('Invalid or expired verification code');
        }

        // Delete used code
        $this->firebase->deleteDocument('verification_codes', $match['id']);

        // Find or create user
        $isEmail = str_contains($contact, '@');
        $userResults = $this->firebase->query('users', $isEmail ? 'email' : 'phone', '==', $contact);

        if (empty($userResults)) {
            // Create new user
            $userId = Uuid::uuid4()->toString();
            $userData = [
                'id' => $userId,
                'name' => $contact,
                'email' => $isEmail ? $contact : null,
                'phone' => $isEmail ? null : $contact,
                'role' => 'customer',
                'createdAt' => date('c'),
                'updatedAt' => date('c')
            ];
            $this->firebase->createDocument('users', $userId, $userData);
            $user = $userData;
        } else {
            $user = $userResults[0];
        }

        $this->logAudit($user['id'], 'AUTH_SUCCESS', 'authentication', null, json_encode([
            'contact' => $contact,
            'method' => 'otp'
        ]));

        return $this->generateTokens($user);
    }

    /**
     * Generate JWT tokens
     */
    public function generateTokens(array $user): array
    {
        $now = time();

        $accessPayload = [
            'userId' => $user['id'],
            'role' => $user['role'],
            'iat' => $now,
            'exp' => $now + $this->accessExpiry
        ];

        $refreshPayload = [
            'userId' => $user['id'],
            'role' => $user['role'],
            'iat' => $now,
            'exp' => $now + $this->refreshExpiry
        ];

        return [
            'accessToken' => JWT::encode($accessPayload, $this->jwtSecret, 'HS256'),
            'refreshToken' => JWT::encode($refreshPayload, $this->jwtSecret, 'HS256'),
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ];
    }

    /**
     * Validate JWT token
     */
    public function validateToken(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return [
                'userId' => $decoded->userId,
                'role' => $decoded->role
            ];
        } catch (\Exception $e) {
            throw new \Exception('Invalid or expired token');
        }
    }

    /**
     * Refresh access token
     */
    public function refreshToken(string $refreshToken): array
    {
        $payload = $this->validateToken($refreshToken);

        $user = $this->firebase->getDocument('users', $payload['userId']);

        if (!$user) {
            throw new \Exception('User not found');
        }

        return $this->generateTokens($user);
    }

    /**
     * Log audit entry
     */
    private function logAudit(?string $userId, string $action, string $resource, ?string $resourceId = null, ?string $details = null): void
    {
        try {
            $id = Uuid::uuid4()->toString();
            $this->firebase->createDocument('audit_logs', $id, [
                'user_id' => $userId,
                'action' => $action,
                'resource' => $resource,
                'resource_id' => $resourceId,
                'details' => $details,
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'timestamp' => date('c')
            ]);
        } catch (\Exception $e) {
            // Silently fail - audit logging shouldn't break auth
            error_log("Audit log failed: " . $e->getMessage());
        }
    }
}
