<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvestorApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(public string $loginUrl) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your Account Has Been Approved - Samawati Capital Investment')
            ->greeting('Hello ' . $notifiable->first_name . ',')
            ->line('Great news! Your investor account has been approved.')
            ->line('You can now log in to your Investor Portal using the following credentials:')
            ->line('**Email:** ' . $notifiable->email)
            ->line('**Password:** Your ID Number (' . $notifiable->id_number . ')')
            ->action('Log In to Your Portal', $this->loginUrl)
            ->line('For your security, you will be required to change your password upon first login.')
            ->line('Thank you for choosing Samawati Capital Investment. We look forward to growing your wealth together!');
    }
}
