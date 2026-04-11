@extends('layouts.app')

@section('title')
    @lang('app.header_title') | @lang('app.settings')
@endsection

@section('content')
{{-- ── Stylesheet ── --}}
<link rel="stylesheet" href="{{ asset('css/booking-admin.css') }}">

    <div class="row mb-2 htsDisplay">
        <div class="col-lg-12">
            <div class="card">
                <div class="card-header" style="">
                    <nav class="nav  justify-content-between">
                        <a class="navbar-brand">@lang('app.settings')</a>
                        <a href="{{route('artisan.view')}}" class="btn btn-info btn-sm"><i class="fa fa-code"></i> @lang('app.commands')</a>
                    </nav>
                </div>

                <div class="card-body">

                    <div class="hts-flash"></div>

                    <form action="{{route('settings.store')}}" method="post" id="hezecomform" class="form-horizontal" enctype="multipart/form-data">
                        {{ csrf_field() }}
                        <div class="form-group">
                            <label class="control-label sr-only" for="APP_NAME">APP NAME</label>
                            <div class="input-group">
                                <div class="input-group-addon left">APP NAME</div>
                                <input id="APP_NAME" name="APP_NAME" class="form-control" type="text" value="{{env('APP_NAME')}}" required />
                            </div>
                        </div>

                        <div class="form-group sr-only">
                            <label class="control-label sr-only" for="APP_NAME">APP_KEY</label>
                            <div class="input-group">
                                <div class="input-group-addon left">APP_KEY</div>
                                <input id="APP_NAME" name="APP_KEY" class="form-control" type="text" value="{{env('APP_KEY')}}"  />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="control-label sr-only" for="GOOGLE_API_KEY">GOOGLE_API_KEY</label>
                            <div class="input-group">
                                <div class="input-group-addon left">GOOGLE_API_KEY</div>
                                <input id="GOOGLE_API_KEY" name="GOOGLE_API_KEY" class="form-control" type="text" value="{{env('GOOGLE_API_KEY')}}"  />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="control-label sr-only" for="CRAFTY_CLICKS_API_KEY">CRAFTY_CLICKS_API_KEY</label>
                            <div class="input-group">
                                <div class="input-group-addon left">CRAFTY_CLICKS_API_KEY</div>
                                <input id="CRAFTY_CLICKS_API_KEY" name="CRAFTY_CLICKS_API_KEY" class="form-control" type="text" value="{{env('CRAFTY_CLICKS_API_KEY')}}"  />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="control-label sr-only" for="CURRENCY_SYMBOL">CURRENCY_SYMBOL</label>
                            <div class="input-group">
                                <div class="input-group-addon left">CURRENCY_SYMBOL</div>
                                <input id="CURRENCY_SYMBOL" name="CURRENCY_SYMBOL" class="form-control" type="text" value="{{env('CURRENCY_SYMBOL')}}"  />
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="control-label sr-only" for="REFRESH_URL_AFTER">REFRESH_URL_AFTER</label>
                            <div class="input-group">
                                <div class="input-group-addon left">REFRESH JOBS  AFTER (seconds)</div>
                                <input id="REFRESH_URL_AFTER" name="REFRESH_URL_AFTER" class="form-control" type="text" value="{{env('REFRESH_URL_AFTER')}}"  />
                            </div>
                        </div>

                        <div class="form-group sr-only">
                            <label class="control-label sr-only" for="VAT">VAT</label>
                            <div class="input-group">
                                <div class="input-group-addon left">VAT%</div>
                                <input id="VAT" name="VAT" class="form-control" type="text" value="{{env('VAT')}}"  />
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="APP_ENV">APP_ENV</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">APP_ENV</div>
                                        <select name="APP_ENV" id="APP_ENV" class="form-control input-sm">
                                            <option value="@if(env('APP_ENV')=='local') local @else production @endif">@if(env('APP_ENV')=='local') Development @else Production @endif</option>
                                            <option value="@if(env('APP_ENV')=='local') production @else local @endif">@if(env('APP_ENV')=='local') Production @else Development @endif</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="APP_DEBUG">APP_DEBUG</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">APP_DEBUG</div>
                                        <select name="APP_DEBUG" id="APP_DEBUG" class="form-control input-sm">
                                            <option value="@if(env('APP_DEBUG')==true) true @else false @endif">@if(env('APP_DEBUG')==true) True @else False @endif</option>
                                            <option value="@if(env('APP_DEBUG')==true) false @else true @endif">@if(env('APP_DEBUG')==true) False @else True @endif</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row sr-only">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="APP_LOG_LEVEL">APP_LOG_LEVEL</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">APP_LOG_LEVEL</div>
                                        <input id="APP_LOG_LEVEL" name="APP_LOG_LEVEL" class="form-control" type="text" value="{{env('APP_LOG_LEVEL')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row ">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="APP_URL">APP_URL</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">APP_URL</div>
                                        <input id="APP_URL" name="APP_URL" class="form-control" type="text" value="{{env('APP_URL')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_CONNECTION">DB_CONNECTION</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_CONNECTION</div>
                                        <input id="DB_CONNECTION" name="DB_CONNECTION" class="form-control" type="text" value="{{env('DB_CONNECTION')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_HOST">HOST</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">HOST</div>
                                        <input id="DB_HOST" name="DB_HOST" class="form-control" type="text" value="{{env('DB_HOST')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_PORT">DB_PORT</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_PORT</div>
                                        <input id="DB_PORT" name="DB_PORT" class="form-control" type="text" value="{{env('DB_PORT')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_DATABASE">DB_DATABASE</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_DATABASE</div>
                                        <input id="DB_DATABASE" name="DB_DATABASE" class="form-control" type="text" value="{{env('DB_DATABASE')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_USERNAME">DB_USERNAME</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_USERNAME</div>
                                        <input id="DB_USERNAME" name="DB_USERNAME" class="form-control" type="text" value="{{env('DB_USERNAME')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_PASSWORD">DB_PASSWORD</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_PASSWORD</div>
                                        <input id="DB_PASSWORD" name="DB_PASSWORD" class="form-control" type="text" value="{{env('DB_PASSWORD')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="TIME_ZONE">TIME_ZONE</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">TIME_ZONE</div>
                                        <input id="TIME_ZONE" name="TIME_ZONE" class="form-control" type="text" value="{{env('TIME_ZONE')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="DB_BACKUP_PATH">DB_BACKUP_PATH</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">DB_BACKUP_PATH</div>
                                        <input id="DB_BACKUP_PATH" name="DB_BACKUP_PATH" class="form-control" type="text" value="{{env('DB_BACKUP_PATH')}}"  />
                                    </div>
                                    <code>e.g (usr/local/mysql/bin) local test e.g (G:\\xampp\\mysql\\bin)</code>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="CACHE_DRIVER">CACHE_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">CACHE_DRIVER</div>
                                        <input id="CACHE_DRIVER" name="CACHE_DRIVER" class="form-control" type="text" value="{{env('CACHE_DRIVER')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="SESSION_DRIVER">SESSION_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">SESSION_DRIVER</div>
                                        <input id="SESSION_DRIVER" name="SESSION_DRIVER" class="form-control" type="text" value="{{env('SESSION_DRIVER')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="QUEUE_DRIVER">QUEUE_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">QUEUE_DRIVER</div>
                                        <input id="QUEUE_DRIVER" name="QUEUE_DRIVER" class="form-control" type="text" value="{{env('QUEUE_DRIVER')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="BROADCAST_DRIVER">BROADCAST_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">BROADCAST_DRIVER</div>
                                        <input id="BROADCAST_DRIVER" name="BROADCAST_DRIVER" class="form-control" type="text" value="{{env('BROADCAST_DRIVER')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row sr-only">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="REDIS_HOST">REDIS_HOST</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">REDIS_HOST</div>
                                        <input id="REDIS_HOST" name="REDIS_HOST" class="form-control" type="text" value="{{env('REDIS_HOST')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="REDIS_PASSWORD">REDIS_PASSWORD</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">REDIS_PASSWORD</div>
                                        <input id="REDIS_PASSWORD" name="REDIS_PASSWORD" class="form-control" type="text" value="{{env('REDIS_PASSWORD')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row sr-only">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="REDIS_HOST">REDIS_PORT</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">REDIS_PORT</div>
                                        <input id="REDIS_PORT" name="REDIS_PORT" class="form-control" type="text" value="{{env('REDIS_PORT')}}"  />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <h5>MAIL CONFIG</h5>
                                    <code>If you using the sendmail option no need to enter mail host, username, port, password etc</code>
                                </div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_FROM_ADDRESS">MAIL_FROM_ADDRESS</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_FROM_ADDRESS</div>
                                        <input id="MAIL_FROM_ADDRESS" name="MAIL_FROM_ADDRESS" class="form-control" type="text" value="{{env('MAIL_FROM_ADDRESS')}}" placeholder="info@hezecom.com"/>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_FROM_NAME">MAIL_FROM_NAME</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_FROM_NAME</div>
                                        <input id="MAIL_FROM_NAME" name="MAIL_FROM_NAME" class="form-control" type="text" value="{{env('MAIL_FROM_NAME')}}" placeholder="Hezecom" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_DRIVER">MAIL_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_DRIVER</div>
                                        <select name="MAIL_DRIVER" id="APP_DEBUG" class="form-control input-sm">
                                            <option value="{{env('MAIL_DRIVER')}}">{{env('MAIL_DRIVER')}}</option>
                                            <option value="sendmail">sendmail</option>
                                            <option value="smtp">smtp</option>
                                            <option value="mailgun">mailgun</option>
                                            <option value="mandrill">mandrill</option>
                                            <option value="ses">ses</option>
                                            <option value="log">log</option>
                                            <option value="array">array</option>
                                        </select>
                                    </div>
                                </div>
                                {{--<div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_DRIVER">MAIL_DRIVER</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_DRIVER</div>
                                        <input id="MAIL_DRIVER" name="MAIL_DRIVER" class="form-control" type="text" value="{{env('MAIL_DRIVER')}}"  />
                                    </div>
                                </div>--}}
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_HOST">MAIL_HOST</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_HOST</div>
                                        <input id="MAIL_HOST" name="MAIL_HOST" class="form-control" type="text" value="{{env('MAIL_HOST')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_PORT">MAIL_PORT</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_PORT</div>
                                        <input id="MAIL_PORT" name="MAIL_PORT" class="form-control" type="text" value="{{env('MAIL_PORT')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_USERNAME">MAIL_USERNAME</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_USERNAME</div>
                                        <input id="MAIL_USERNAME" name="MAIL_USERNAME" class="form-control" type="text" value="{{env('MAIL_USERNAME')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_PASSWORD">MAIL_PASSWORD</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_PASSWORD</div>
                                        <input id="MAIL_PASSWORD" name="MAIL_PASSWORD" class="form-control" type="text" value="{{env('MAIL_PASSWORD')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="MAIL_ENCRYPTION">MAIL_ENCRYPTION</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">MAIL_ENCRYPTION</div>
                                        <input id="MAIL_ENCRYPTION" name="MAIL_ENCRYPTION" class="form-control" type="text" value="{{env('MAIL_ENCRYPTION')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row sr-only">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="PUSHER_APP_ID">PUSHER_APP_ID</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">PUSHER_APP_ID</div>
                                        <input id="PUSHER_APP_ID" name="PUSHER_APP_ID" class="form-control" type="text" value="{{env('PUSHER_APP_ID')}}"  />
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="PUSHER_APP_KEY">PUSHER_APP_KEY</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">PUSHER_APP_KEY</div>
                                        <input id="PUSHER_APP_KEY" name="PUSHER_APP_KEY" class="form-control" type="text" value="{{env('PUSHER_APP_KEY')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="row sr-only">
                            <div class="col-md-6">
                                <div class="form-group">
                                    <label class="control-label sr-only" for="PUSHER_APP_SECRET">PUSHER_APP_SECRET</label>
                                    <div class="input-group">
                                        <div class="input-group-addon left">PUSHER_APP_ID</div>
                                        <input id="PUSHER_APP_SECRET" name="PUSHER_APP_SECRET" class="form-control" type="text" value="{{env('PUSHER_APP_SECRET')}}" />
                                    </div>
                                </div>
                            </div>
                        </div><!--/row-->

                        {{--EMAIL VERIFICATION--}}
                        <div class="row">
                            <div class="col-md-3 col-xs-4">
                                <div class="form-group">
                                    <h5>EMAIL VERIFICATION</h5>
                                </div>
                            </div>
                            <div class="col-md-5 col-xs-4">
                                <div class="form-group">
                                    @if(env('EMAIL_VERIFY')=='ON')
                                        <input class="tgl tgl-skewed" name="EMAIL_VERIFY" id="EMAIL_VERIFY" value="ON" type="checkbox" checked="checked"/>
                                        <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="EMAIL_VERIFY"></label>
                                    @else
                                        <input class="tgl tgl-skewed" name="EMAIL_VERIFY" id="EMAIL_VERIFY" value="ON" type="checkbox"/>
                                        <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="EMAIL_VERIFY"></label>
                                    @endif
                                </div>
                            </div>
                        </div><!--/row-->

                        <div class="socials" style="display: none">
                            {{--FACEBOOK--}}
                            <div class="row">
                                <div class="col-md-3 col-xs-4">
                                    <div class="form-group">
                                        <h5>FACEBOOK AUTH</h5>
                                    </div>
                                </div>
                                <div class="col-md-5 col-xs-4">
                                    <div class="form-group">
                                        @if(env('FACEBOOK_AUTH')=='ON')
                                            <input class="tgl tgl-skewed" name="FACEBOOK_AUTH" id="FACEBOOK_AUTH" value="ON" type="checkbox" checked="checked"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="FACEBOOK_AUTH"></label>
                                        @else
                                            <input class="tgl tgl-skewed" name="FACEBOOK_AUTH" id="FACEBOOK_AUTH" value="ON" type="checkbox"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="FACEBOOK_AUTH"></label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4 col-xs-4">
                                    <div class="form-group">
                                        <p><a href="https://developers.facebook.com" target="_blank">https://developers.facebook.com</a></p>
                                    </div>
                                </div>
                            </div><!--/row-->

                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon left">FACEBOOK_ID</div>
                                    <input id="FACEBOOK_ID" name="FACEBOOK_ID" class="form-control" type="text" value="{{env('FACEBOOK_ID')}}"  />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="control-label sr-only" for="FACEBOOK_SECRET">FACEBOOK_SECRET</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">FACEBOOK_SECRET</div>
                                    <input id="FACEBOOK_SECRET" name="FACEBOOK_SECRET" class="form-control" type="text" value="{{env('FACEBOOK_SECRET')}}" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="control-label sr-only" for="FACEBOOK_URL">FACEBOOK_URL</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">FACEBOOK_URL</div>
                                    <input id="FACEBOOK_URL" name="FACEBOOK_URL" class="form-control" type="text" value="{{env('FACEBOOK_URL')}}" />
                                </div>
                            </div>

                            {{--TWITTER--}}
                            <div class="row">
                                <div class="col-md-3 col-xs-4">
                                    <div class="form-group">
                                        <h5>TWITTER AUTH</h5>
                                    </div>
                                </div>
                                <div class="col-md-5 col-xs-4">
                                    <div class="form-group">
                                        @if(env('TWITTER_AUTH')=='ON')
                                            <input class="tgl tgl-skewed" name="TWITTER_AUTH" id="TWITTER_AUTH" value="ON" type="checkbox" checked="checked"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="TWITTER_AUTH"></label>
                                        @else
                                            <input class="tgl tgl-skewed" name="TWITTER_AUTH" id="TWITTER_AUTH" value="ON" type="checkbox"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="TWITTER_AUTH"></label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4 col-xs-4">
                                    <div class="form-group">
                                        <p><a href="https://apps.twitter.com" target="_blank">https://apps.twitter.com</a></p>
                                    </div>
                                </div>
                            </div><!--/row-->

                            <div class="form-group">
                                <label class="control-label sr-only" for="TWITTER_ID">TWITTER_ID</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">TWITTER_ID</div>
                                    <input id="TWITTER_ID" name="TWITTER_ID" class="form-control" type="text" value="{{env('TWITTER_ID')}}"  />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="control-label sr-only" for="TWITTER_SECRET">TWITTER_SECRET</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">TWITTER_SECRET</div>
                                    <input id="TWITTER_SECRET" name="TWITTER_SECRET" class="form-control" type="text" value="{{env('TWITTER_SECRET')}}" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="control-label sr-only" for="TWITTER_URL">TWITTER_URL</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">TWITTER_URL</div>
                                    <input id="TWITTER_URL" name="TWITTER_URL" class="form-control" type="text" value="{{env('TWITTER_URL')}}" />
                                </div>
                            </div>


                            {{--GOOGLE--}}
                            <div class="row">
                                <div class="col-md-3 col-xs-4">
                                    <div class="form-group">
                                        <h5>GOOGLE AUTH</h5>
                                    </div>
                                </div>
                                <div class="col-md-5 col-xs-4">
                                    <div class="form-group">
                                        @if(env('GOOGLE_AUTH')=='ON')
                                            <input class="tgl tgl-skewed" name="GOOGLE_AUTH" id="GOOGLE_AUTH" value="ON" type="checkbox" checked="checked"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="GOOGLE_AUTH"></label>
                                        @else
                                            <input class="tgl tgl-skewed" name="GOOGLE_AUTH" id="GOOGLE_AUTH" value="ON" type="checkbox"/>
                                            <label class="tgl-btn" data-tg-off="OFF" data-tg-on="ON" for="GOOGLE_AUTH"></label>
                                        @endif
                                    </div>
                                </div>
                                <div class="col-md-4 col-xs-4">
                                    <div class="form-group">
                                        <p><a href="https://console.developers.google.com" target="_blank">https://console.developers.google.com</a></p>
                                    </div>
                                </div>
                            </div><!--/row-->
                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon left">GOOGLE_ID</div>
                                    <input id="GOOGLE_ID" name="GOOGLE_ID" class="form-control" type="text" value="{{env('GOOGLE_ID')}}"  />
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="control-label sr-only" for="GOOGLE_SECRET">GOOGLE_SECRET</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">GOOGLE_SECRET</div>
                                    <input id="GOOGLE_SECRET" name="GOOGLE_SECRET" class="form-control" type="text" value="{{env('GOOGLE_SECRET')}}" />
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="control-label sr-only" for="GOOGLE_REDIRECT">GOOGLE_REDIRECT</label>
                                <div class="input-group">
                                    <div class="input-group-addon left">GOOGLE_REDIRECT</div>
                                    <input id="GOOGLE_REDIRECT" name="GOOGLE_REDIRECT" class="form-control" type="text" value="{{env('GOOGLE_REDIRECT')}}" />
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <button type="submit" class="btn btn-info btn-lg mr-2" name="btn-savee" id="btnStatus">
                                <span class="fa fa-hdd"></span> Save Settings
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection

@section('scripts')
    <script>

    </script>
@endsection

