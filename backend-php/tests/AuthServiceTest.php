<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use App\Services\AuthService;

final class AuthServiceTest extends TestCase
{
    public function testPasswordHashingWorks(): void
    {
        $service = new AuthService();
        $password = "secret123";
        $hash = $service->hashPassword($password);

        $this->assertNotEquals($password, $hash);
        $this->assertTrue($service->verifyPassword($password, $hash));
        $this->assertFalse($service->verifyPassword("wrongpassword", $hash));
    }

    public function testJwtTokenGenerationAndValidation(): void
    {
        $service = new AuthService();
        $userData = [
            'id' => 'user-123',
            'name' => 'Test User',
            'role' => 'customer'
        ];

        $tokens = $service->generateTokens($userData);
        $this->assertArrayHasKey('accessToken', $tokens);
        $this->assertArrayHasKey('refreshToken', $tokens);
        $this->assertArrayHasKey('user', $tokens);

        $decoded = $service->validateToken($tokens['accessToken']);
        $this->assertEquals($userData['id'], $decoded['userId']);
        $this->assertEquals($userData['role'], $decoded['role']);
    }

    public function testInvalidTokenValidationThrowsException(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Invalid or expired token');

        $service = new AuthService();
        $service->validateToken("definitely.not.a.valid.token");
    }
}
