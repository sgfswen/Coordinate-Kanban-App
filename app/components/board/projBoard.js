var React = require('react'),
    Nav = require('./../Nav'),
    List = require('./list/List'),
    Modal = require('react-materialize').Modal,
    helpers = require('./../utils/helpers'),
    Packery = require('packery'),
    Draggabilly = require('draggabilly');

Modal.defaultProps = {
    actions: false
};

var ProjBoard = React.createClass({
    getInitialState: function() {
        return {
            lists: []
        }
    },

    componentDidMount: function() {
        // Packery intitialize
        var elem = document.querySelector('.grid');
        var pckry = new Packery(elem, {
            // options
            columnWidth: '.grid-sizer',
            gutter: '.gutter-sizer',
            itemSelector: '.grid-item',
            percentPosition: true,
            fitWidth: false
        });
        // Packery + Draggabilly
        // Drag Lists
        pckry.getItemElements().forEach(function(itemElem) {
            var draggie = new Draggabilly(itemElem);
            pckry.bindDraggabillyEvents(draggie);
        });

        // Make server call to get project
        helpers.getProject("bake-some-pies").then(function(data){
            this.setState({lists: data.lists});
        }.bind(this))
    },

    componentDidUpdate: function(prevProps, prevState) {
        // user must enter at least a topic
        if (prevState.lists !== this.state.lists) {
            console.log('true')
            console.log(this.state.lists);
        }
        // Packery intitialize
        var elem = document.querySelector('.grid');
        var pckry = new Packery(elem, {
            // options
            columnWidth: '.grid-sizer',
            gutter: '.gutter-sizer',
            itemSelector: '.grid-item',
            percentPosition: true,
            fitWidth: false
        });
        // Packery + Draggabilly
        // Drag Lists
        pckry.getItemElements().forEach(function(itemElem) {
            var draggie = new Draggabilly(itemElem);
            pckry.bindDraggabillyEvents(draggie);
        });
    },

    renderLists: function() {
        return this.state.lists.map(function(currentList,index){
            return (
                <List 
                    key={index}
                    id={"list-"+index}
                    title={currentList.title}
                    tasks={currentList.tasks}
                />
            )
        });
    },

    render: function() {
        return (
            <div>
                
                {/* Nav */}
                <Nav />

                {/* Filter Dropdown */}
                <ul id="dropdown-filters" className="dropdown-content">
                    <li><a href="#!">All Tasks</a></li>
                    <li><a href="#!">My Tasks</a></li>
                    <li><a href="#!">Due Soon</a></li>
                    <li className="divider"></li>
                    <li><a href="#!">Remove Filter</a></li>
                </ul>

                {/* Board */}
                <main>
                    <div className="main-board">

                        {/* Filter */}
                        <div className="proj-buttons-div">
                             <div className="proj-buttons-inner">
                                 <a href="#!" className="dropdown-button" id="filter-icon" data-activates="dropdown-filters" data-beloworigin="true" data-hover="true"><i className="material-icons center">filter_list</i></a>
                             </div>

                            {/* Add a List */}
                             <div className="proj-buttons-inner">
                                <Modal
                                    trigger={
                                        <a href="#modal1" className="tooltipped" data-delay="50" data-tooltip="Add a List"><i className="material-icons center">add</i></a>
                                    }
                                >

                                    <div className="modal-content">
                                        <h4>Add a List</h4>
                                        <div className="row">
                                            {/* FORM WITH POST */}
                                            <form className="col s12" onSubmit={this.handleSubmit}>
                                                <div className="row">
                                                    <div className="input-field col s12">
                                                        <input id="list-name" type="text" className="validate" />
                                                        <label htmlFor="list-name">List Name</label>
                                                    </div>
                                                    <div className="col s12 right-align">
                                                        <a href="#!" className="modal-action modal-close waves-effect waves-green btn btn-modal">Save</a>
                                                        <a href="#!" className="modal-action modal-close waves-effect waves-green btn">Cancel</a>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                </Modal>

                             </div>
                        </div>

                        {/* Packery grid settings */}
                        <div className="grid">
                            <div className="gutter-sizer"></div>
                            <div className="grid-sizer"></div>

                            {/* List Component */}

                            {this.renderLists.call(this)}

                        </div>
                    </div>
                </main>
            
            </div>
        );
    }
});

module.exports = ProjBoard;