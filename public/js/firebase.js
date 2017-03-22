// CONFIGURATION
var config = {
    apiKey: "AIzaSyAo0p0M13L2_zPK-YJ5IITd-WczdJTUFPA",
    authDomain: "schulzzug-b84fc.firebaseapp.com",
    databaseURL: "https://schulzzug-b84fc.firebaseio.com",
    storageBucket: "schulzzug-b84fc.appspot.com",
    messagingSenderId: "188834675814"
};
firebase.initializeApp(config);

var firebaseTotalDistance = 0;
var firebaseTotalScore = 0;
var firebaseTotalUsers = 0;
var firebaseActiveUsers = 0;

firebase.auth().signInAnonymously().then(function() {
    configurePresence();
}).catch(function(error) {
    console.log(error.message);
});

function configurePresence() {
  var connections = firebase.database().ref('connections');
  var connectedRef = firebase.database().ref('.info/connected');
  connectedRef.once('value', function(snap) {
      if (snap.val() === true) {
        var con = connections.push(true);
        con.onDisconnect().remove();
      }
  });
}

// EXPORTED FUNCTIONS
function updateGameResult(score, distance) {
  var userId = firebase.auth().currentUser.uid;
  var timestamp = firebase.database.ServerValue.TIMESTAMP;
  var gameResult = {
    score: score,
    distance: distance,
    timestamp: timestamp
  }
  var updates = {}
  updates['/game-results/' + userId] = gameResult;
  return firebase.database().ref().update(updates)
}

// EXPORTED FUNCTIONS
function updateStatistics() {
  var gamesRef = firebase.database().ref('game-results');
  gamesRef.once('value', function(snapshot) {
    var games = snapshot.val();
    firebaseTotalDistance = 0;
    firebaseTotalScore = 0;
    firebaseTotalUsers = snapshot.numChildren();
    for (var v in games) {
      if (games.hasOwnProperty(v)) {
        firebaseTotalDistance += games[v].distance;
        firebaseTotalScore += games[v].score;
      }
    }
  });
  var connections = firebase.database().ref('connections');
  connections.once('value', function(snapshot) {
    firebaseActiveUsers = snapshot.numChildren();
  });
}
