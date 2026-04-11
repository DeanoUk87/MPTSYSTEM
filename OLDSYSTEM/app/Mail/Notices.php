<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class Notices extends Mailable
{
    use Queueable, SerializesModels;

    public $title;

    public $message;

    public $user;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($title, $message, $user = null)
    {
        $this->title = $title;
        $this->message = $message;
        $this->user = $user;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $title = $this->title;
        $body = $this->message;
        $user = $this->user;

        return $this->view('mail.Notices', compact('title', 'body', 'user'))->subject($title);
    }
}
