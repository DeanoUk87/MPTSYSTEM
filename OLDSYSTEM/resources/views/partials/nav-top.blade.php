<div class="top-bar" style="background-color: #01579b;">
    <div class="container-fluid">
        <div class="row">
            <div class="col">
                <a class="admin-logo" href="{{url('/')}}">
                    <h1>
                        <img alt="" src="{{asset('templates/admin/images/small.png')}}" class="logo-icon margin-r-10" >
                        <img alt="" src="{{asset('templates/admin/images/logotxt.png')}}" class="toggle-none hidden-xs" >
                    </h1>
                </a>
                <div class="left-nav-toggle" >
                    <a  href="#" class="nav-collapse"><i class="fa fa-bars"></i></a>
                </div>
                <div class="left-nav-collapsed" >
                    <a  href="#" class="nav-collapsed"><i class="fa fa-bars"></i></a>
                </div>

                <div class="search-form hidden-xs">
                    <p class="text-white" style="margin:5px -30px;">Welcome: {{ ucwords(Auth::user()->name) }}</p>
                </div>
            </div>
            <div class="col">
                <ul class="list-inline top-right-nav">
                    <li class="dropdown avtar-dropdown">
                        <a class="dropdown-toggle" data-toggle="dropdown" href="#">
                            @if(Auth::user()->avatar)
                                <img class="rounded-circle" src="{{ asset('uploads/avatars')}}/{{ Auth::user()->avatar }}" alt="avatar" style="width: 30px;">
                            @else
                                <img class="rounded-circle" src="{{ asset('templates/admin/images/avatar.jpg')}}" alt="avatar" style="width: 30px;">
                            @endif
                        </a>
                        <ul class="dropdown-menu top-dropdown">
                            <li>
                                <a class="dropdown-item" href="{{route('profile.update')}}"><i class="fa fa-user blue"></i> Profile</a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="{{route('2fa.setup')}}"><i class="fa fa-barcode amber"></i> Manage 2FA</a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="{{route('profile.updatepassword')}}"><i class="fa fa-key purple"></i> Password</a>
                            </li>
                            <li class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item" href="{{ route('logout') }}" onclick="event.preventDefault();document.getElementById('logout-form').submit();"><i class="fa fa-power-off orange"></i> Sign out</a>
                                <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                                    {{ csrf_field() }}
                                    <input type="hidden" name="user" value="{{Auth::user()->id}}">
                                </form>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
