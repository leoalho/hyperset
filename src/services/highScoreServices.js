const {database} = require('../mongo')

const highscores = database.collection('highscores');

async function addUser(id, nickname){
    await highscores.insertOne({_id:id, name: nickname, points: 0, startedPlaying: new Date()})
}
async function updatePoints(id, newpoints){
    await highscores.updateOne({_id:id},{ $set: {points: newpoints}})
}
async function highscoresToday(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear(),
                        "month":new Date().getMonth()+1, 
                        "day": new Date().getDate()
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresThisMonth(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear(),
                        "month":new Date().getMonth()+1, 
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresThisYear(n){
    const top10 = await highscores.aggregate([
                    {"$project": {
                        "name":1,
                        "points":1,
                        "year": {"$year":  "$startedPlaying" },
                        "month":{"$month": "$startedPlaying"},
                        "day":{"$dayOfMonth": "$startedPlaying"},
                        }
                    },{"$match": {
                        "year": new Date().getFullYear()
                        }
                    },{"$sort":{
                        "points":-1,
                        "startedPlaying":1
                        }
                    },{"$limit":n}]).toArray();
    return top10;
}
async function highscoresAllTime(n){
    const top10 = await highscores.find().sort({points:-1, startedPlaying:1}).limit(n).toArray()
    return top10;
}

module.exports = {addUser, updatePoints, highscoresToday, highscoresThisMonth, highscoresThisYear, highscoresAllTime}