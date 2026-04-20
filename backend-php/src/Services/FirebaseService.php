<?php
/**
 * Firebase Service
 * 
 * Handles communication with Firebase REST API (Firestore and Auth)
 */

declare(strict_types=1);

namespace App\Services;

class FirebaseService
{
    private string $projectId;
    private string $apiKey;
    private ?string $serviceAccount = null;

    public function __construct()
    {
        $this->projectId = $_ENV['FIREBASE_PROJECT_ID'] ?? '';
        $this->apiKey = $_ENV['FIREBASE_API_KEY'] ?? '';
    }

    /**
     * General CURL request to Firebase
     */
    private function request(string $url, string $method = 'GET', ?array $data = null, array $headers = []): array
    {
        $ch = curl_init();

        $params = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
            CURLOPT_TIMEOUT => 30
        ];

        if ($data !== null) {
            $params[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($ch, $params);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $decoded = json_decode((string) $response, true);

        if ($httpCode >= 400) {
            $error = $decoded['error']['message'] ?? $decoded['error'] ?? 'Unknown error';
            throw new \Exception("Firebase Error ($httpCode): " . $error);
        }

        return $decoded ?: [];
    }

    // --- Firestore Operations ---

    /**
     * Get a document from Firestore
     */
    public function getDocument(string $collection, string $documentId): ?array
    {
        try {
            $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}/{$documentId}";
            $response = $this->request($url);
            return $this->formatFirestoreResponse($response);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), '404'))
                return null;
            throw $e;
        }
    }

    /**
     * Create a document in Firestore
     */
    public function createDocument(string $collection, string $documentId, array $data): array
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}?documentId={$documentId}";
        $firestoreData = $this->toFirestoreFormat($data);
        $response = $this->request($url, 'POST', ['fields' => $firestoreData]);
        return $this->formatFirestoreResponse($response);
    }

    /**
     * Update a document in Firestore (Patch)
     */
    public function updateDocument(string $collection, string $documentId, array $data): array
    {
        $updateMask = array_map(fn($k) => "updateMask.fieldPaths=" . urlencode($k), array_keys($data));
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}/{$documentId}?" . implode('&', $updateMask);

        $firestoreData = $this->toFirestoreFormat($data);
        $response = $this->request($url, 'PATCH', ['fields' => $firestoreData]);
        return $this->formatFirestoreResponse($response);
    }

    /**
     * Delete a document in Firestore
     */
    public function deleteDocument(string $collection, string $documentId): void
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}/{$documentId}";
        $this->request($url, 'DELETE');
    }

    /**
     * List all documents in a collection
     */
    public function listDocuments(string $collection): array
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents/{$collection}";
        try {
            $response = $this->request($url);
            $results = [];
            if (isset($response['documents'])) {
                foreach ($response['documents'] as $doc) {
                    $results[] = $this->formatFirestoreResponse($doc);
                }
            }
            return $results;
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), '404'))
                return [];
            throw $e;
        }
    }

    /**
     * Query Firestore documents (Simple filter)
     */
    public function query(string $collection, string $field, string $operator, $value): array
    {
        $url = "https://firestore.googleapis.com/v1/projects/{$this->projectId}/databases/(default)/documents:runQuery";

        $data = [
            'structuredQuery' => [
                'from' => [['collectionId' => $collection]],
                'where' => [
                    'fieldFilter' => [
                        'field' => ['fieldPath' => $field],
                        'op' => $this->mapOperator($operator),
                        'value' => $this->toFirestoreValue($value)
                    ]
                ],
                'limit' => 100
            ]
        ];

        $response = $this->request($url, 'POST', $data);
        $results = [];
        foreach ($response as $item) {
            if (isset($item['document'])) {
                $results[] = $this->formatFirestoreResponse($item['document']);
            }
        }
        return $results;
    }

    // --- Auth Operations ---

    /**
     * Sign up with email and password
     */
    public function signUp(string $email, string $password): array
    {
        $url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={$this->apiKey}";
        return $this->request($url, 'POST', [
            'email' => $email,
            'password' => $password,
            'returnSecureToken' => true
        ]);
    }

    /**
     * Sign in with email and password
     */
    public function signIn(string $email, string $password): array
    {
        $url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={$this->apiKey}";
        return $this->request($url, 'POST', [
            'email' => $email,
            'password' => $password,
            'returnSecureToken' => true
        ]);
    }

    // --- Helpers ---

    private function mapOperator(string $op): string
    {
        $map = [
            '==' => 'EQUAL',
            '>' => 'GREATER_THAN',
            '<' => 'LESS_THAN',
            '>=' => 'GREATER_THAN_OR_EQUAL',
            '<=' => 'LESS_THAN_OR_EQUAL',
            'in' => 'IN'
        ];
        return $map[$op] ?? 'EQUAL';
    }

    private function toFirestoreFormat(array $data): array
    {
        $formatted = [];
        foreach ($data as $key => $value) {
            $formatted[$key] = $this->toFirestoreValue($value);
        }
        return $formatted;
    }

    private function toFirestoreValue($value): array
    {
        if (is_null($value))
            return ['nullValue' => null];
        if (is_bool($value))
            return ['booleanValue' => $value];
        if (is_int($value) || is_float($value))
            return ['doubleValue' => $value];
        if (is_array($value)) {
            // Check if it's an associative array
            if (array_keys($value) !== range(0, count($value) - 1)) {
                return ['mapValue' => ['fields' => $this->toFirestoreFormat($value)]];
            }
            return ['arrayValue' => ['values' => array_map([$this, 'toFirestoreValue'], $value)]];
        }
        return ['stringValue' => (string) $value];
    }

    private function formatFirestoreResponse(array $response): array
    {
        $data = [];
        if (isset($response['name'])) {
            $parts = explode('/', $response['name']);
            $data['id'] = end($parts);
        }
        if (isset($response['fields'])) {
            foreach ($response['fields'] as $key => $value) {
                $data[$key] = $this->parseFirestoreValue($value);
            }
        }
        return $data;
    }

    private function parseFirestoreValue(array $value)
    {
        if (isset($value['stringValue']))
            return $value['stringValue'];
        if (isset($value['doubleValue']))
            return (float) $value['doubleValue'];
        if (isset($value['integerValue']))
            return (int) $value['integerValue'];
        if (isset($value['booleanValue']))
            return (bool) $value['booleanValue'];
        if (isset($value['nullValue']))
            return null;
        if (isset($value['timestampValue']))
            return $value['timestampValue'];
        if (isset($value['mapValue']['fields'])) {
            $map = [];
            foreach ($value['mapValue']['fields'] as $k => $v) {
                $map[$k] = $this->parseFirestoreValue($v);
            }
            return $map;
        }
        if (isset($value['arrayValue']['values'])) {
            return array_map([$this, 'parseFirestoreValue'], $value['arrayValue']['values']);
        }
        return null;
    }
}
