<?php

namespace App\Services;

class SmtpService
{
    private $host;
    private $port;
    private $user;
    private $pass;
    private $fromEmail;
    private $fromName;

    public function __construct()
    {
        $this->host = $_ENV['SMTP_HOST'] ?? '';
        $this->port = (int)($_ENV['SMTP_PORT'] ?? 465);
        $this->user = $_ENV['SMTP_USER'] ?? '';
        $this->pass = $_ENV['SMTP_PASS'] ?? '';
        $this->fromEmail = $_ENV['SMTP_FROM_EMAIL'] ?? '';
        $this->fromName = $_ENV['SMTP_FROM_NAME'] ?? 'Our Harvest Tote';
    }

    public function send(string $to, string $subject, string $body): bool
    {
        if (empty($this->host) || empty($this->user) || empty($this->pass)) {
            error_log("SMTP not configured");
            return false;
        }

        try {
            $socket = fsockopen(
                ($this->port === 465 ? 'ssl://' : '') . $this->host,
                $this->port,
                $errno,
                $errstr,
                30
            );

            if (!$socket) {
                throw new \Exception("Could not connect to SMTP host: $errstr ($errno)");
            }

            $this->getResponse($socket); // 220

            $this->sendCommand($socket, "EHLO " . $this->host);
            $this->getResponse($socket);

            if ($this->port !== 465) {
                $this->sendCommand($socket, "STARTTLS");
                $this->getResponse($socket);
                stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
                $this->sendCommand($socket, "EHLO " . $this->host);
                $this->getResponse($socket);
            }

            $this->sendCommand($socket, "AUTH LOGIN");
            $this->getResponse($socket);

            $this->sendCommand($socket, base64_encode($this->user));
            $this->getResponse($socket);

            $this->sendCommand($socket, base64_encode($this->pass));
            $this->getResponse($socket);

            $this->sendCommand($socket, "MAIL FROM: <{$this->fromEmail}>");
            $this->getResponse($socket);

            $this->sendCommand($socket, "RCPT TO: <$to>");
            $this->getResponse($socket);

            $this->sendCommand($socket, "DATA");
            $this->getResponse($socket);

            $headers = [
                "From: \"{$this->fromName}\" <{$this->fromEmail}>",
                "To: <$to>",
                "Subject: $subject",
                "MIME-Version: 1.0",
                "Content-Type: text/html; charset=UTF-8",
                "Date: " . date('r'),
                "Message-ID: <" . time() . "." . uniqid() . "@" . $this->host . ">"
            ];

            $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
            $this->sendCommand($socket, $message);
            $this->getResponse($socket);

            $this->sendCommand($socket, "QUIT");
            fclose($socket);

            return true;
        } catch (\Exception $e) {
            error_log("SMTP Error: " . $e->getMessage());
            if (isset($socket) && is_resource($socket)) fclose($socket);
            return false;
        }
    }

    private function sendCommand($socket, $command)
    {
        fputs($socket, $command . "\r\n");
    }

    private function getResponse($socket)
    {
        $response = "";
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == " ") break;
        }
        return $response;
    }
}
