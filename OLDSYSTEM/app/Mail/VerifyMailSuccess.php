<?php

namespace App\Mail;

use App\Models\Messagingsettings;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyMailSuccess extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($user)
    {
        $this->user = $user;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $message = Messagingsettings::where('message_type', 'mail-signup-welcome')->limit(1)->first();

        $find = ['{user}', '{title}', '{login_link}'];
        $replace = [$this->user['name'], env('APP_NAME'), route('login')];

        $title = $message->title;
        $body = (str_replace($find, $replace, $message->body));

        return $this->view('mail.verifySuccess', compact('title', 'body'))->subject(env('APP_NAME').' - Welcome on board');
    }
}
