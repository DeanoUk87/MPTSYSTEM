<nav class="toggle-sidebar" id="right-sidebar-toggle">
    <div class="nano">
        <div class="nano-content">
            <div>
                <ul class="list-inline nav-tab-card clearfix" role="tablist">
                    <li class="active" role="presentation">
                        <a aria-controls="activities" data-toggle="tab" href="#activities" role="tab">Activities</a>
                    </li>
                    <li class="active" role="presentation">
                        <a aria-controls="tasks" data-toggle="tab" href="#tasks" role="tab">Tasks</a>
                    </li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane active" id="activities" role="act">
                        <ul class="list-unstyled sidebar-contact-list">
                            <li class="clearfix">
                                <a class="media-box" href="#">
                                    <span class="pull-right">
                                        <span class="circle circle-success circle-lg"></span>
                                    </span>
                                    <span class="pull-left">
                                        <img alt="user" class="media-box-object rounded-circle" src="{{ asset('templates/admin/images/avatar.jpg')}}" style="width: 50px;">
                                    </span>
                                    <span class="media-box-body">
                                        <span class="media-box-heading"><strong>John Doe</strong><br>
										<small class="text-muted"><i class="fa fa-clock-o"></i> 20 Minutes Ago.</small></span>
                                    </span>
                                </a>
                            </li>
                        </ul>
                    </div>
                    {{--Tasks--}}
                    <div class="tab-pane" id="tasks" role="task">
                        <ul class="list-unstyled sidebar-contact-list">
                            <li class="clearfix">
                                info here
                            </li>
                        </ul>
                    </div>

                </div>
            </div>
        </div>
    </div>
</nav>