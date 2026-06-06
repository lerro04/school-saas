<?php

namespace App\Services;

use Paynow\Payments\Paynow;
use App\Models\Payment;
use App\Models\FeeInvoice;

class PaynowService
{
    protected Paynow $paynow;

    public function __construct()
{
    $this->paynow = new Paynow(
        env('PAYNOW_INTEGRATION_ID'),
        env('PAYNOW_INTEGRATION_KEY'),
        env('PAYNOW_RESULT_URL'),
        env('PAYNOW_RETURN_URL')
    );

    // Use Paynow test environment
    $this->paynow->setResultUrl(env('PAYNOW_RESULT_URL'));
    $this->paynow->setReturnUrl(env('PAYNOW_RETURN_URL'));
}

    public function initiatePayment(FeeInvoice $invoice, string $email, string $phone, string $method): array
    {
        $payment = $this->paynow->createPayment(
            'INV-' . $invoice->invoice_number,
            $email
        );

        $payment->add(
            'School Fees - ' . $invoice->term,
            $invoice->balance
        );

        try {
            if (in_array($method, ['ecocash', 'onemoney'])) {
                // Mobile money — initiate express checkout
                $response = $this->paynow->sendMobile($payment, $phone, $method);
            } else {
                // Web checkout
                $response = $this->paynow->send($payment);
                \Log::info('Paynow response', [
    'success' => $response->success(),
    'status'  => $response->status(),
    'data'    => (array) $response,
]);
            }

            if ($response->success()) {
                return [
                    'success'      => true,
                    'poll_url'     => $response->pollUrl(),
                    'redirect_url' => $response->redirectUrl() ?? null,
                    'instructions' => $response->instructions() ?? null,
                ];
            }

            return [
    'success' => false,
    'error'   => print_r($response->errors(), true) . ' | status: ' . ($response->status() ?? 'unknown'),
];

        } catch (\Exception $e) {
    return [
        'success' => false,
        'error'   => $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine(),
    ];
}
    }

    public function pollStatus(string $pollUrl): array
    {
        try {
            $status = $this->paynow->pollTransaction($pollUrl);

            return [
                'paid'   => $status->paid(),
                'status' => $status->status(),
                'amount' => $status->amount(),
            ];
        } catch (\Exception $e) {
            return [
                'paid'   => false,
                'status' => 'error',
                'amount' => 0,
            ];
        }
    }
}