async function addUser(db, id, nickname){
    console.log(id,nickname)
    await db.run("INSERT INTO highscores (socket_id, username) VALUES (?, ?)", [id, nickname])
}

async function updatePoints(db, id, newpoints){
    await db.run("UPDATE highscores SET score=? WHERE socket_id=?", [newpoints, id])
}

async function highscoresToday(db, n){
    return []
}

async function highscoresThisMonth(n){
   return []
}

async function highscoresThisYear(n){
    return []
}

async function highscoresAllTime(n){
    return []
}

module.exports = {addUser, updatePoints, highscoresToday, highscoresThisMonth, highscoresThisYear, highscoresAllTime}