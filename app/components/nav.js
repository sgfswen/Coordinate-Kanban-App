var React = require('react');

var Nav = React.createClass({
    render: function(){
        return (
            <div>

                {/* Dropdowns */} 
                <ul id="dropdown-projects" className="dropdown-content">
                    <li><a href="#">Project One</a></li>
                    <li><a href="#">Project Two</a></li>
                    <li className="divider"></li>
                    <li><a href="#"><i className="tiny material-icons">add</i>Create Project...</a></li>
                </ul>
                <ul id="dropdown-notifications" className="dropdown-content">
                    <li><a href="#">
                        <span className="notif-team-member">Goku</span> completed <span className="notif-task">Obtain 3rd dragonball</span>.<br /><span className="notif-time">22 minutes ago</span>
                        </a></li>
                    <li><a href="#"><span className="notif-team-member">Piccolo</span> was assigned to <span className="notif-task">Mentor Gohan</span>.<br /><span className="notif-time">3 hours ago</span></a></li>
                    {/* Show when empty */}
                    <li><a>No recent notifications</a></li>
                </ul>
                <ul id="dropdown-profile" className="dropdown-content">
                    <li><span className="user_name">Tina Turner</span></li>
                    <li><a href="#">Sign Out</a></li>
                </ul>
                {/* Nav */}
                <div className="nav-fixed">
                    <nav>
                        <div className="nav-wrapper">
                            {/* Normal Nav */} 
                            <a href="#" className="brand-logo center">Co-ord-in-ate!</a>
                            <a href="#" data-activates="mobile-demo" className="button-collapse"><i className="material-icons">menu</i></a>
                            <ul className="left hide-on-med-and-down">
                                {/* Search Bar */}
                                <li>
                                    <form>
                                        <div className="input-field">
                                            <input id="search" type="search" required placeholder="Search..." />
                                            <label htmlFor="search"><i className="material-icons ">search</i></label>
                                            <i className="material-icons">close</i>
                                        </div>
                                    </form>
                                </li>
                            </ul>
                            {/* Top Right Nav */} 
                            <ul id="nav-mobile" className="right hide-on-med-and-down">
                                <li>
                                    <a href="#"><i className="material-icons tooltipped" data-position="bottom" data-delay="50" data-tooltip="Team">people</i></a>
                                </li>
                                <li>
                                    <a href="#" className="dropdown-button" data-activates="dropdown-projects" data-beloworigin="true" data-hover="true"><i className="material-icons">developer_board</i></a>
                                </li>
                                <li>
                                    <a href="#" className="dropdown-button" data-activates="dropdown-notifications" data-beloworigin="true" data-hover="true"><i className="material-icons">notifications</i></a>
                                </li>
                                <li>
                                    <a href="#" className="dropdown-button" data-activates="dropdown-profile" data-beloworigin="true" data-hover="true"><i className="material-icons">person_pin</i></a>
                                </li>
                            </ul>
                        </div>
                    </nav>

                    {/* Side Nav */} 
                    {/* side nav must be outside of nav tag to coexist w/ fixed nav. */}
                    <ul className="side-nav collapsible" id="mobile-demo">
                        <li>
                            <div className="collapsible-header"><a href="#"><i className="tiny material-icons">people</i>Team</a></div>
                        </li>
                        <li>
                            <div className="collapsible-header"><a href="#" className="secondary-content"><i className="tiny material-icons">expand_more</i></a><a href="#"><i className="tiny material-icons">developer_board</i>Projects</a></div>
                            <div className="collapsible-body">
                                <ul>
                                    <li><a href="#">Project One</a></li>
                                    <li><a href="#">Project Two</a></li>
                                    <li><a href="#"><i className="tiny material-icons">add</i>Create Project...</a></li>
                                </ul>
                            </div>
                        </li>
                        <li>
                            <div className="collapsible-header"><a href="#" className="secondary-content"><i className="tiny material-icons">expand_more</i></a><a href="#"><i className="tiny material-icons">notifications</i>Notifications</a></div>
                            <div className="collapsible-body">
                                <ul>
                                    <li><a href="#"><span className="notif-team-member">Goku</span> completed <span className="notif-task">Obtain 3rd dragonball</span>.</a></li>
                                    <li><a href="#"><span className="notif-team-member">Piccolo</span> was assigned to <span className="notif-task">Mentor Gohan</span>.</a></li>
                                    {/* Show when empty */}
                                    <li><a>No recent notifications</a></li>
                                </ul>
                            </div>
                        </li>
                        <li>
                            <a><span className="user_name">Tina Turner</span></a>
                        </li>
                        <li>
                            <a href="#">Sign Out</a>
                        </li>
                    </ul>
                </div>

                {/*<div>{this.props.children}</div>*/}

            </div>

        );
    }
});

module.exports = Nav;