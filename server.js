// import npm modules
var 
    express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    morgan = require('morgan'),
    moment = require('moment'),
    Promise = require('bluebird'),
    passport = require('passport'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
    LocalStrategy = require('passport-local').Strategy;

mongoose.Promise = Promise;

var app = express();
var server = require('http').Server(app);
// Local Host or Heroku env.Port
var PORT = process.env.PORT || 3000;

// start logger and make public files available
app.use(morgan('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Start Mongoose & test connection
// Need Mongoose ObjectId type in order to search for specific model's ID
var ObjectId = require('mongoose').Types.ObjectId,
    databaseUri = 'mongodb://localhost/kanban',
    db = mongoose.connection,
    // Import Mongoose models for tables
    User = require('./models/User.js'),
    Team = require('./models/Team.js'),
    Project = require('./models/Project.js'),
    List = require('./models/List.js'),
    Task = require('./models/Task.js');

// Use either localhost or env, if in Heroku
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
} 
else {
    mongoose.connect(databaseUri);
}

// Catch Mongoose errors
db.on('error', function(error) {
    console.log('Mongoose Error: ', error);
});

//Connect to database
db.once('open', function() {
    console.log('Mongoose connection successful.');
});

// Passport.js passport-local-mongoose authentication
app.use(session({
  secret: 'turn around bright eyes',
  store: new MongoStore({
    mongooseConnection: db,
  }),
  resave: true,
  saveUninitialized: true,
  cookie: { 
    maxAge: 6000000,
    secure: false 
  }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser(function(user, done){
    done(null, user.id);
}));
passport.deserializeUser(User.deserializeUser(function(id, done) {
    User.findOne({ _id: id }).then(function(user) {
        done(null, { id: user.id, username: user.username});
    })
}));

/* ======== Default Route ======== */
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

/* ======== User Account Actions ======== */
// Create new account
app.post('/newuser', function(req, res, next) {
    console.log(req.body);
    // Passport-Local Mongoose function; will create new user, hash the password (2nd argument) and store username, email, hashed pw, and pw salt in DB
    User.register(new User({
        username: req.body.username,
        email: req.body.email,
    }), req.body.password, function(error, userAccount) {
        if (error) {
            console.log('there was an error ' + error);
            if (error.name == 'UserExistsError') {
                return res.json({ error: 'userExists', message : 'a user with that email already exists.'});
            }
            else {
                return res.json({ message : error.message });       
            }
        }
        // After account created, authenticate user
        passport.authenticate('local')(req, res, function () {
            req.session.save(function(err) {
                if (err) {
                    return next(err);
                }
                return res.redirect('/');
            })
        });
    });
});

// Log in - if fail redirect to login page
app.post('/userlogin', function(req, res, next) {
    passport.authenticate('local', function(err, user) {
        if (err) { 
            return res.send({success: false, message: err }); 
        }
        if (!user) { 
            return res.send({success: false, message: "Invalid Login" }); 
        }
        req.logIn(user, function(err) {
            if (err) { 
                return next(err); 
            }
            return res.send({success: true, message: "Login successful." }); 
        });
    })(req, res, next);
});

// Logout Route
app.get('/logout', function(req, res) {
  req.logout();
  req.session.destroy();
  res.send({success: true, message: "You have been logged out." });
});

/* ======== Require authentication on all routes ======== */
// Middleware authentication will intercept unauth users and send 401 Not Auth error.
app.all('*', function(req, res, next){
    if(req.isAuthenticated()){
        next();
    }
    else {
        return res.send({success: false, message: "Invalid Login" });
    }
});

// Route is for login check 
app.get('/userlogin', function(req, res, next) {
    if(req.isAuthenticated()){
        return res.send({success: true, message: "Login successful." });
    }
    else {
        return res.send({success: false, message: "Invalid Login" });
    }
})

/* ======== Projects List Actions ======== */
// Get User Projects
app.get('/projects', function(req, res) {
    //Team.find()
    //TODO
});

// Create Project
app.post('/:team_name/newproject', function(req, res) {
    // Look for Project for Team in DB, if in DB throw error, if not, save to DB
    // console.log(req.session.cookie.user);
    var teamQuery = {team_name: {
        $regex: new RegExp('^' + req.params.team_name, 'i')
    }}

    Team.findOne(teamQuery, function(error, team) {
        if (error) {
            console.log(err);
        } 
        else if (team <= 0) {
            res.json({ success: false, message: 'Team is not in database.'});
        }
        else {
            var projQuery = { 
                $and: [
                    {project_name: req.body.project_name},
                    {team_name: ObjectId(team._id)}
                ]
            };
            // ensure project is not in DB and assoc w/ team
            Project.find(projQuery, function(err, doc) {
                if (err) {
                    console.log(err);
                } 
                else if (doc > 0) {
                    console.log(error);
                    res.json({ success: false, message: 'This team already has a project with that name.'});
                } else {
                    var newProj = new Project({
                        project_name: req.body.project_name,
                        teamID: ObjectId(team._id)
                    });
                    newProj.save(function(error, proj) {
                        if (error) {
                            console.log(error);
                            res.json({ success: false, message: 'Could not save to DB.'});
                        } 
                        else {
                            res.json({ success: true, message: 'New project created.'});
                        }
                    });
                }
            });
        }
    });
});

// Get Project - redirect to Get - All Lists and Tasks
app.get('/:project_name/getall', function(req,res){
    var resObj;
    var cleanProjName = req.params.project_name.split('-').join(' ');
    var projQuery = { project_name: { 
        $regex: new RegExp('^' + cleanProjName, 'i') 
    }}
    Project.findOne(projQuery, function(err, proj) {
        if (err) {
            console.log(err);
            res.sendStatus(404);
        }
        else if (proj === 0) {
            res.json({ success: false, message: 'Could not find project.'});
        }
        else {
            // Add list of all users
            User.find({}, function(err, users){
                if (err) {
                    console.log(err);
                    res.sendStatus(404);
                }
                else if (proj === 0) {
                    res.json({ success: false, message: 'Could not find users.'});
                }
                else {
                    var userArr = []
                    users.forEach(function(el){
                        var userObj = {user_name: el.username, id: el._id}
                        userArr.push(userObj);
                    })

                    var listQuery = {projectID: ObjectId(proj._id.toString())}
                    List.find({}, function(err, lists) {
                        if (err) {
                            console.log(err);
                            res.sendStatus(404);
                        }
                        else if (lists === 0 ) {
                            // A project with no lists was found.
                            res.json({ 
                                success: true,
                                users: userArr,
                                project_name: proj.project_name,
                                lists: [{
                                    title: '',
                                    listId: '',
                                    tasks: []
                                }]
                            });
                        }
                        else {
                            resObj = { 
                                success: true,
                                users: userArr,
                                project_name: proj.project_name,
                                lists: []
                            }
                            lists.forEach(function(currList, indexList) {
                                var populatedList = {
                                    title: currList.list_name,
                                    listId: currList._id,
                                    tasks: []
                                };
                                var taskQuery = {list: currList._id};
                                Task.find(taskQuery)
                                .populate(
                                    'assigned', 'username -_id'
                                )
                                .exec(function(err, tasks){
                                    if (err) {
                                        console.log(err);
                                        res.sendStatus(404);
                                    }
                                    else if (tasks === 0) {
                                        // A list with no tasks was found.
                                        resObj.lists.push(populatedList);
                                    }
                                    else {
                                        tasks.forEach(function(currTask, indexTask){
                                            populatedList.tasks.push(currTask);
                                        });
                                        resObj.lists.push(populatedList);
                                    }
                                });
                            });
                            setTimeout(function(){
                                res.json(resObj);
                            }, 1000);
                        }
                    });
                }
            });
        }
    });
});

/* ======== Team Actions ======== */
// Create New Team, set creating user as default admin
app.post('/newteam', function(req,res) {
    console.log(req.user.email)
    var userQuery = {email: req.user.email}
    User.findOne(userQuery, function(error, doc) {
        var newTeam = new Team({
            team_name: req.body.team_name,
            team_desc: req.body.team_desc,
            admin_users: [{ 
                userID: ObjectId(doc._id),
                username: doc.username,
                email: doc.email,
                userRole: "Team Creator"
            }]
        });
        var teamQuery = {team_name: req.body.team_name}
        Team.find(teamQuery, function(err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(404);
            }
            else if (docs.length <= 0) {
                newTeam.save(function(error, doc) {
                    if (error) {
                        console.log(error);
                        res.json({ success: false, message: 'Could not save to DB.'});
                    } 
                    else {
                        res.json({ success: true, message: 'New team created.'});
                    }
                });
            }
            else {
                res.json({ success: false, message: 'Team not available.'});
            }
        });
        
    })
})
// Delete team
app.post('/deleteteam', function(req,res){
    //TODO
});

// Get Team Members
app.post('/myteam', function(req, res) {
    var userQuery = {"email": req.body.email};
    console.log(userQuery);

    User.findOne(userQuery, function(err, doc) {
        if (err) {
            console.log(err);
        } 
        else {
            console.log(doc);
            res.json(doc);
        }
    });
});

// Add Team Member
app.post('/:team_name/addteammember', function(req, res){
    // Check to see if user in database, using email. if not, send user not found
    var userQuery = {email: {
        $regex: new RegExp('^' + req.body.email, 'i')
    }};

    User.findOne(userQuery, function(err, user){
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'an error occurred'});
        }
        else if (user <= 0) {
            res.send({success: false, 'message': 'user not found'});
        }
        else {
            // Look for team, if found add user id
            var teamQuery = {"team_name": {
                $regex: new RegExp('^' + req.params.team_name, 'i')
            }};
            var teamUpdate = { 
                $addToSet: { 
                    non_admin_users: { 
                        userID: ObjectId(user._id),
                        username: user.username,
                        email: user.email,
                        userRole: req.body.role
                    } 
                }
            };
            Team.findOneAndUpdate(teamQuery, teamUpdate, function(err, doc) {
                if (err) {
                    console.log(err);
                    res.send({success: false, 'message': 'server error, update did not succeed'});
                }
                else if (doc <= 0)
                    res.send({success: false, 'message': 'team not found'});
                else {
                    res.send({success: true, 'message': 'success'});
                }
            });       
            
        }
    });
});

// Remove Team Member
app.get('/:teamid/removemember', function(req, res){
    //TODO
});

// Update Team Member (name, role, title) (your permissions have been udpated - page refresh)
//TODO

/* ======== Project Actions - certain actions (add/update member/list/task/comment) should update notifications table ======== */
// Get - All Lists and Tasks
app.post('/getprojlists', function(req,res) {
    //TODO
});
// Get - My Tasks
    //TODO
// Get - Due Soon
    //TODO

// Add List
app.post('/:team_name/:project_name/newlist', function(req, res) {
    var teamQuery = {team_name: {
        $regex: new RegExp('^' + req.params.team_name, 'i')
    }};
    Team.findOne(teamQuery, function(error, team){
        if (error) {
            console.log(error);
            res.send({success: false, 'message': 'an error occurred'});
        }
        else if (team <= 0) {
            res.send({success: false, 'message': 'team not found'});
        }
        else {
            // Remove dashes from project_name param and replace w/ space for regex search
            var cleanProjName = req.params.project_name.split('-').join(' ');
            var projQuery = { project_name: { 
                $regex: new RegExp('^' + cleanProjName, 'i') 
            }}
            var projectQuery = {
                $and: [
                    projQuery,
                    { teamID: ObjectId(team._id) }
                ] 
            };
            Project.findOne(projectQuery, function(err, project){
                if (err) {
                    console.log(err);
                    res.send({success: false, 'message': 'an error occurred'});
                }
                else if (project <= 0) {
                    res.send({success: false, 'message': 'project not found'});
                }
                else {
                    var newList = new List({
                        list_name: req.body.list_name,
                        projectID: ObjectId(project._id)
                    });
                    newList.save(function(err, list) {
                        if (err) {
                            console.log(err);
                            res.json({ success: false, message: 'Could not save to DB.'});
                        } 
                        else {
                            res.json({ success: true, message: 'New list created.'});
                        }
                    });
                }
            });   
        }
    });
});
// Add Task (user can have more than one task w/ same title, diff _id)
app.post('/:listid/newtask', function(req, res) {
    var newTask = new Task({
        task_name: req.body.task_name,
        list: ObjectId(req.params.listid)
    });
    newTask.save(function(err, task) {
        if (err) {
            console.log(err);
            res.json({ success: false, message: 'Could not save to DB.'});
        }
        else {
            res.json({ success: true, message: 'New task created.'});
        }
    })
});

// Update Member to Task
app.post('/:taskid/assignmember', function(req, res) {
    console.log(req.body)
    var userQuery = { username: req.body.user_name }
    User.findOne(userQuery, function(err, user){
        if (err) {
            console.log(err);
            res.json({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (user <= 0) {
            res.send({success: false, 'message': 'user not found'});
        }
        else {
            var taskQuery = { 
                _id: ObjectId(req.params.taskid),
                "assigned": {
                    $not: {
                        $eq: user._id
                    }
                }
            }
            
            var updateMember = {
                $push: {
                    "assigned": user._id
                }
            }
            Task.findOneAndUpdate(taskQuery, updateMember, {upsert: true}, function(err, doc) {
                if (err) {
                    console.log(err);
                    res.send({success: false, 'message': 'server error, update did not succeed'});
                }
                else if (doc <= 0) {
                    res.send({success: false, 'message': 'task not found'});
                }
                else {
                    res.send({success: true, 'message': 'success'});
                }
            });
            
        }
    });
});
// Add Comment to Task
app.post('/:taskid/addcomment', function(req, res) {
    console.log(req)
    var userQuery = { username: req.user.username }
    console.log(userQuery)
    User.findOne(userQuery, function(err, user){
        if (err) {
            console.log(err);
            res.json({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (user <= 0) {
            res.send({success: false, 'message': 'user not found'});
        }
        else {
            var time = moment().format("dddd, MMMM Do YYYY, h:mm:ss a")
            var taskQuery = { _id: ObjectId(req.params.taskid) }
            var updateMember = {
                $push: {
                    comments: {
                        userID: ObjectId(user._id),
                        text: req.body.comment,
                        comment_date: time
                    }
                }
            }
            Task.findOneAndUpdate(taskQuery, updateMember, function(err, doc) {
                if (err) {
                    console.log(err);
                    res.send({success: false, 'message': 'server error, update did not succeed'});
                }
                else if (doc <= 0) {
                    res.send({success: false, 'message': 'task not found'});
                }
                else {
                    console.log(doc)
                    res.send({success: true, 'message': 'success'});
                }
            });
        }
    });
});
// Update Task Description
app.post('/:taskid/desc', function(req, res) {
    var taskQuery = { _id: ObjectId(req.params.taskid) }
    var updateDesc = {
        $set: {
            description: req.body.desc
        }
    }
    Task.findOneAndUpdate(taskQuery, updateDesc, function(err, doc) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (doc <= 0) {
            res.send({success: false, 'message': 'task not found'});
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    });
});
// Update List
app.post('/:listid/listupdate', function(req, res) {
    var listQuery = { _id: ObjectId(req.params.listid) }
    var update = {
        $set: {
            list_name: req.body.title
        }
    }
    List.findOneAndUpdate(listQuery, update, function(err, doc) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (doc <= 0) {
            res.send({success: false, 'message': 'list not found'});
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    });
});
// Update Task
app.post('/:taskid/taskupdate', function(req, res) {
    var updateObj;
    var title = req.body.field;
    // query can update either task_name or description
    updateObj = {
        task_name: req.body.task_name,
        description: req.body.desc
    }

    console.log(updateObj);
    var taskQuery = { _id: ObjectId(req.params.taskid) }
    var update = {
        $set: updateObj
    }
    Task.findOneAndUpdate(taskQuery, update, function(err, doc) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (doc <= 0) {
            res.send({success: false, 'message': 'task not found'});
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    });
});
// Remove Member from Task
app.post('/:taskid/removemember', function(req, res) {
    var userQuery = { username: req.body.username }
    User.findOne(userQuery, function(err, user){
        if (err) {
            console.log(err);
            res.json({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (user <= 0) {
            res.send({success: false, 'message': 'user not found'});
        }
        else {
            var taskQuery = { _id: ObjectId(req.params.taskid) }
            var updateMember = {
                $pull: {
                    assigned: {
                        userID: ObjectId(user._id)
                    }
                }
            }
            Task.findOneAndUpdate(taskQuery, updateMember, function(err, doc) {
                if (err) {
                    console.log(err);
                    res.send({success: false, 'message': 'server error, update did not succeed'});
                }
                else if (doc <= 0) {
                    res.send({success: false, 'message': 'task not found'});
                }
                else {
                    res.send({success: true, 'message': 'success'});
                }
            });
            
        }
    });
});
// Delete List
app.post('/:listid/removelist', function(req, res) {
    var listQuery = {
        _id: ObjectId(req.params.listid)
    }
    List.remove(listQuery, function(err, obj) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        } 
        else if (obj.result.n === 0) {
            res.send({success: false, 'message': 'the list was not found'})
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    })
});
// Delete Task
app.post('/:taskid/removetask', function(req, res) {
    var listQuery = {
        _id: ObjectId(req.params.taskid)
    }
    Task.remove(listQuery, function(err, obj) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        } 
        else if (obj.result.n === 0) {
            res.send({success: false, 'message': 'the task was not found'})
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    });
});
// Add/update Due Date
app.post('/:taskid/duedate', function(req, res) {
    var taskQuery = {
        _id: ObjectId(req.params.taskid)
    }
    var update = {
        $set: {
            due_date: new Date(req.body.due_date)
        }
    }
    Task.findOneAndUpdate(taskQuery, update, function(err, doc) {
        if (err) {
            console.log(err);
            res.send({success: false, 'message': 'server error, update did not succeed'});
        }
        else if (doc <= 0) {
            res.send({success: false, 'message': 'task not found'});
        }
        else {
            res.send({success: true, 'message': 'success'});
        }
    });
});

// Turn on server
app.listen(PORT, function() {
    console.log('Server now listening on port ' + PORT);
});