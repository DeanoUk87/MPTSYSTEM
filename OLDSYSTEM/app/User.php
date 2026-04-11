<?php

namespace App;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Passport\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens;
    use HasRoles;
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password', 'username', 'avatar', 'provider',
        'provider_id', 'user_status', 'created_for', 'driverId', 'customerId',
        'google2fa_secret', 'recovery_code',
    ];

    protected $casts = [
        'recovery_codes' => 'array',
    ];
    /* protected $fillable = [
         'name', 'email', 'password'
     ];*/

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function setPasswordAttribute($password)
    {
        if (! empty($password)) {
            if (preg_match('/^\$2y\$[0-9]*\$.{50,}$/', $password)) {
                $this->attributes['password'] = $password;
            } else {
                $this->attributes['password'] = bcrypt($password);
            }

            return true;
        }

        return false;
    }
}
