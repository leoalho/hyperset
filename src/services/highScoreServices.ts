import { Db } from "../types";

async function addUser(db: Db, id: string, nickname: string){
    console.log(id,nickname)
    await db.run("INSERT INTO highscores (socket_id, username) VALUES (?, ?)", [id, nickname])
}

async function updatePoints(db: Db, id: string, newpoints: number){
    await db.run("UPDATE highscores SET score=? WHERE socket_id=?", [newpoints, id])
}

async function highscoresToday(db: Db, n: number){
    return db.all(`
        SELECT username, score
        FROM highscores
        WHERE date(highscores.created_at)=date(CURRENT_TIMESTAMP)
        ORDER BY
            score DESC,
            highscores.created_at ASC
        LIMIT ?;
        `, [n])
    }

async function highscoresThisMonth(db: Db, n: number){
    return db.all(`
        SELECT username, score
        FROM highscores
        WHERE strftime('%m-%Y', highscores.created_at)=strftime('%m-%Y', CURRENT_TIMESTAMP)
        ORDER BY
            score DESC,
            highscores.created_at ASC
        LIMIT ?;
        `, [n])
}

async function highscoresThisYear(db: Db, n: number){
    return db.all(`
        SELECT username, score
        FROM highscores
        WHERE strftime('%Y', highscores.created_at)=strftime('%Y', CURRENT_TIMESTAMP)
        ORDER BY
            score DESC,
            highscores.created_at ASC
        LIMIT ?;
        `, [n])
}

async function highscoresAllTime(db: Db, n: number){
    return db.all(`
        SELECT username, score
        FROM highscores
        ORDER BY
            score DESC,
            highscores.created_at ASC
        LIMIT ?;
        `, [n])
}

export default {addUser, updatePoints, highscoresToday, highscoresThisMonth, highscoresThisYear, highscoresAllTime}