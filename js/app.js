$(document).foundation()

var config = {
    apiKey: "AIzaSyAo0p0M13L2_zPK-YJ5IITd-WczdJTUFPA",
    authDomain: "schulzzug-b84fc.firebaseapp.com",
    databaseURL: "https://schulzzug-b84fc.firebaseio.com",
    storageBucket: "schulzzug-b84fc.appspot.com",
    messagingSenderId: "188834675814"
};
firebase.initializeApp(config);

firebase.auth().signInAnonymously().then(function() {
  window.setInterval(function(){
    updateStatistics();
  }, 5000);
}).catch(function(error) {
    console.log(error.message);
});

function updateStatistics() {
  var gamesRef = firebase.database().ref('game-results');
  gamesRef.once('value', function(snapshot) {
    var games = snapshot.val();
    var firebaseTotalDistance = 0;
    var firebaseTotalScore = 0;
    var firebaseTotalUsers = snapshot.numChildren();
    for (var v in games) {
      if (games.hasOwnProperty(v)) {
        firebaseTotalDistance += games[v].distance;
        firebaseTotalScore += games[v].score;
      }
    }
    document.getElementById("schlzzg-player").textContent = firebaseTotalUsers;
    document.getElementById("schlzzg-scorrr").textContent = firebaseTotalScore;
    document.getElementById("schlzzg-distnc").textContent = "" + (firebaseTotalDistance/1000).toFixed(1) + " km" //get_metric_prefix(firebaseTotalDistance, 0) + "m";

  });
  var connections = firebase.database().ref('connections');
  connections.once('value', function(snapshot) {
    var firebaseActiveUsers = snapshot.numChildren();
    document.getElementById("schlzzg-online").textContent = get_metric_prefix(firebaseActiveUsers, 0);
  });
}

function get_metric_prefix(decimal, number_digits) {
    let prefix = [
                  { value: 1E18, symbol: "E" },
                  { value: 1E15, symbol: "P" },
                  { value: 1E12, symbol: "T" },
                  { value: 1E09, symbol: "G" },
                  { value: 1E06, symbol: "M" },
                  { value: 1E03, symbol: "k" }
                  ];
    let expression = /\.0+$|(\.[0-9]*[1-9])0+$/;
    for (let i = 0; i < prefix.length; i++) {
        if (decimal >= prefix[i].value) {
            return (decimal / prefix[i].value)
            .toFixed(number_digits)
            .replace(expression, "$1")
            + prefix[i].symbol;
        }
    }
    return decimal.toFixed(number_digits).replace(expression, "$1");
}
