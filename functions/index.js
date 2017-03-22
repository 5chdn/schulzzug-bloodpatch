const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.updateTotalScore = functions.database.ref('/game-results/{userId}/score')
    .onWrite(event => {
      // @TODO fetch oldScore if available
      const oldScore = 0;
      const newScore = event.data.val();
      if (oldScore > newScore) {
        newScore = oldScore;
      } else {
        newScore - oldScore;
      }
      const scoreRef = admin.database.ref('/statistics/total-score')
    return scoreRef.transaction(function(currentScore) {
        return (currentScore || 0) + newScore;
    });
  });

exports.updateTotalDistance = functions.database.ref('/game-results/{userId}/distance')
    .onWrite(event => {
      // @TODO fetch oldDistance if available
      const oldDistance = 0;
      const newDistance = event.data.val() - oldDistance;
      const distanceRef = admin.database.ref('/statistics/total-distance')
    return distanceRef.transaction(function(currentDistance) {
        return (currentDistance || 0) + newDistance;
    });
  });
