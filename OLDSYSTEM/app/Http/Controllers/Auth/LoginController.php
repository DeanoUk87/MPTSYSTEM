<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Jobaccess;
use App\User;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory;
use Illuminate\Contracts\View\View;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = '/admin/booking/0';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except('logout');
    }

    /**
     * Validate the user login request.
     *
     * @return void
     */
    protected function validateLogin(Request $request)
    {
        $this->validate($request, [
            $this->username() => 'required',
            'password' => 'required',
            'captcha' => 'required|captcha',
        ],
            ['captcha.captcha' => 'Invalid captcha code.']
        );
    }

    /**
     * Redirect the user to the OAuth Provider.
     */
    public function redirectToProvider($provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Get the needed authorization credentials from the request.
     *
     * @return array
     */
    protected function credentials(Request $request)
    {
        $field = filter_var($request->get($this->username()), FILTER_VALIDATE_EMAIL)
            ? $this->username()
            : 'username';

        return [
            $field => $request->get($this->username()),
            'password' => $request->password,
        ];
    }

    /**
     * @return Application|Factory|View|\Illuminate\Foundation\Application|RedirectResponse|Response
     *
     * @throws ValidationException
     */
    public function postLogin(Request $request)
    {
        $this->validateLogin($request);

        $user = User::where('email', $request->email)->first();

        if ($user && Hash::check($request->password, $user->password)) {

            if ($user->google2fa_secret) {
                $google2fa = app('pragmarx.google2fa');

                // Ask for 2FA code
                return view('auth.2fa.verify', compact('user'));
            }
            auth()->login($user);

            return redirect()->intended($this->redirectTo);
        }

        return $this->sendFailedLoginResponse($request);
    }

    /**
     * Obtain the user information from provider.  Check if the user already exists in our
     * database by looking up their provider_id in the database.
     * If the user exists, log them in. Otherwise, create a new user then log them in. After that
     * redirect them to the authenticated users homepage.
     */
    public function handleProviderCallback($provider)
    {
        $user = Socialite::driver($provider)->user();

        $authUser = $this->findOrCreateUser($user, $provider);
        $date1 = Carbon::now()->format('Y-m-d');
        Auth::login($authUser, true);

        return redirect($this->redirectTo.'?date1='.$date1.'&date'.$date1.'');
    }

    /**
     * If a user has registered before using social auth, return the user
     * else, create a new user object.
     *
     * @param  $user  Socialite user object
     * @param  $provider  Social auth provider
     * @return User
     */
    public function findOrCreateUser($user, $provider)
    {
        $authUser = User::where('provider_id', $user->id)->first();
        if ($authUser) {
            return $authUser;
        }
        $newUser = User::create([
            'name' => $user->name,
            'email' => $user->email,
            'provider' => $provider,
            'user_status' => 'Active',
            'provider_id' => $user->id,
            'email_verified_at' => Carbon::now(config('timezone'))->toDateTimeString(),
        ]);
        $newUser->assignRole('user');

        return $newUser;
    }

    /**
     * Create a new controller instance.
     */
    public function refreshCaptcha()
    {
        return response()->json(['captcha' => captcha_img()]);
    }

    public function logout(Request $request)
    {
        $userId = Auth::id();
        if ($userId) {
            Jobaccess::where('user_id', $userId)->where('access', 1)->delete();
        }

        $this->guard()->logout();

        $request->session()->forget('2fa_verified');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    protected function loggedOut(Request $request)
    {
        $user = $request->input('user');
        $query = Jobaccess::where('user_id', $user)->where('access', 1)->delete();
        $request->session()->forget('2fa_verified');
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        if ($query) {
            return redirect()->route('login');
        }

        return redirect()->route('login');
    }
}
